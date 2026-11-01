package com.github.notrealshanks.confluobackend.service;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import com.github.notrealshanks.confluobackend.dto.ExecutionFile;
import com.github.notrealshanks.confluobackend.dto.ExecutionRequest;
import com.github.notrealshanks.confluobackend.model.Project;
import com.github.notrealshanks.confluobackend.model.Role;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ExecutionServiceTests {

    @Mock
    private ProjectService projectService;

    @Mock
    private RateLimitService rateLimitService;

    private ExecutionService executionService;

    @BeforeEach
    void setUp() {
        executionService = new ExecutionService(projectService, rateLimitService);
        ReflectionTestUtils.setField(executionService, "executionServiceUrl", "http://localhost:4000");
        ReflectionTestUtils.setField(executionService, "executionServiceToken", "test-token");
    }

    @Test
    void viewerCannotExecuteCode() {
        Project project = new Project();
        project.setId("p-1");
        when(projectService.requireAccess("user-viewer", "p-1"))
                .thenReturn(new ProjectService.Access(project, Role.VIEWER));

        ExecutionRequest request = new ExecutionRequest(
                "cpp",
                "hello.cpp",
                List.of(new ExecutionFile("hello.cpp", "int main() {}"))
        );

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                executionService.execute("user-viewer", "p-1", request));

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
        assertEquals("Only project editors can run code", ex.getReason());
    }

    @Test
    void pathTraversalInEntrypointIsRejected() {
        Project project = new Project();
        project.setId("p-1");
        when(projectService.requireAccess("user-editor", "p-1"))
                .thenReturn(new ProjectService.Access(project, Role.EDITOR));

        ExecutionRequest request = new ExecutionRequest(
                "cpp",
                "../secret.cpp",
                List.of(new ExecutionFile("hello.cpp", "int main() {}"))
        );

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                executionService.execute("user-editor", "p-1", request));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
    }

    @Test
    void commandInjectionInEntrypointIsRejected() {
        Project project = new Project();
        project.setId("p-1");
        when(projectService.requireAccess("user-editor", "p-1"))
                .thenReturn(new ProjectService.Access(project, Role.EDITOR));

        ExecutionRequest request = new ExecutionRequest(
                "cpp",
                "hello.cpp; rm -rf /",
                List.of(new ExecutionFile("hello.cpp", "int main() {}"))
        );

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                executionService.execute("user-editor", "p-1", request));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertEquals("Invalid entrypoint syntax", ex.getReason());
    }

    @Test
    void pathTraversalInFilesIsRejected() {
        Project project = new Project();
        project.setId("p-1");
        when(projectService.requireAccess("user-editor", "p-1"))
                .thenReturn(new ProjectService.Access(project, Role.EDITOR));

        ExecutionRequest request = new ExecutionRequest(
                "cpp",
                "hello.cpp",
                List.of(new ExecutionFile("../../etc/passwd", "malicious"))
        );

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                executionService.execute("user-editor", "p-1", request));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertEquals("Invalid workspace path", ex.getReason());
    }

    @Test
    void rateLimiterExceededThrowsTooManyRequests() {
        Project project = new Project();
        project.setId("p-1");
        when(projectService.requireAccess("user-editor", "p-1"))
                .thenReturn(new ProjectService.Access(project, Role.EDITOR));

        doThrow(new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Too many requests"))
                .when(rateLimitService).check("exec:user-editor");

        ExecutionRequest request = new ExecutionRequest(
                "python",
                "script.py",
                List.of(new ExecutionFile("script.py", "print(1)"))
        );

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                executionService.execute("user-editor", "p-1", request));

        assertEquals(HttpStatus.TOO_MANY_REQUESTS, ex.getStatusCode());
    }

    @Test
    void missingServiceUrlThrowsServiceUnavailable() {
        ReflectionTestUtils.setField(executionService, "executionServiceUrl", "");

        Project project = new Project();
        project.setId("p-1");
        when(projectService.requireAccess("user-editor", "p-1"))
                .thenReturn(new ProjectService.Access(project, Role.EDITOR));

        ExecutionRequest request = new ExecutionRequest(
                "python",
                "script.py",
                List.of(new ExecutionFile("script.py", "print(1)"))
        );

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                executionService.execute("user-editor", "p-1", request));

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, ex.getStatusCode());
    }
}
