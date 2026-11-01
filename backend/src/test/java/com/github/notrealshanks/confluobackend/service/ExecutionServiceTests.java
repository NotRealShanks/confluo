package com.github.notrealshanks.confluobackend.service;

import java.time.Duration;
import java.util.ArrayList;
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
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
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
        ReflectionTestUtils.setField(executionService, "executionServiceToken", "test-token-at-least-32-chars-long-abc");
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
    void guestUserCannotExecuteCode() {
        ExecutionRequest request = new ExecutionRequest(
                "python",
                "main.py",
                List.of(new ExecutionFile("main.py", "print('hello')"))
        );

        ResponseStatusException ex1 = assertThrows(ResponseStatusException.class, () ->
                executionService.execute("guest:abc-123", "p-1", request));
        assertEquals(HttpStatus.FORBIDDEN, ex1.getStatusCode());
        assertEquals("Guests are not allowed to execute code", ex1.getReason());

        ResponseStatusException ex2 = assertThrows(ResponseStatusException.class, () ->
                executionService.execute("guest", "p-1", request));
        assertEquals(HttpStatus.FORBIDDEN, ex2.getStatusCode());
        assertEquals("Guests are not allowed to execute code", ex2.getReason());
    }

    @Test
    void nonMemberCannotExecuteCode() {
        when(projectService.requireAccess("user-non-member", "p-1"))
                .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));

        ExecutionRequest request = new ExecutionRequest(
                "python",
                "main.py",
                List.of(new ExecutionFile("main.py", "print('hello')"))
        );

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                executionService.execute("user-non-member", "p-1", request));

        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
        assertEquals("Project not found", ex.getReason());
    }

    @Test
    void fileCountExceedingLimitIsRejected() {
        Project project = new Project();
        project.setId("p-1");
        when(projectService.requireAccess("user-editor", "p-1"))
                .thenReturn(new ProjectService.Access(project, Role.EDITOR));

        List<ExecutionFile> files = new ArrayList<>();
        for (int i = 0; i < 101; i++) {
            files.add(new ExecutionFile("file" + i + ".py", "print(" + i + ")"));
        }

        ExecutionRequest request = new ExecutionRequest("python", "file0.py", files);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                executionService.execute("user-editor", "p-1", request));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertTrue(ex.getReason().contains("File count exceeds limit"));
    }

    @Test
    void individualFileSizeExceeding200KBIsRejected() {
        Project project = new Project();
        project.setId("p-1");
        when(projectService.requireAccess("user-editor", "p-1"))
                .thenReturn(new ProjectService.Access(project, Role.EDITOR));

        String largeContent = "a".repeat(201 * 1024);
        ExecutionRequest request = new ExecutionRequest(
                "python",
                "big.py",
                List.of(new ExecutionFile("big.py", largeContent))
        );

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                executionService.execute("user-editor", "p-1", request));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertTrue(ex.getReason().contains("exceeds maximum size of 200 KB"));
    }

    @Test
    void aggregatePayloadExceeding1MBIsRejected() {
        Project project = new Project();
        project.setId("p-1");
        when(projectService.requireAccess("user-editor", "p-1"))
                .thenReturn(new ProjectService.Access(project, Role.EDITOR));

        List<ExecutionFile> files = new ArrayList<>();
        // 6 files of 190 KB = 1,140 KB > 1 MB
        for (int i = 0; i < 6; i++) {
            files.add(new ExecutionFile("file" + i + ".txt", "x".repeat(190 * 1024)));
        }

        ExecutionRequest request = new ExecutionRequest("python", "file0.txt", files);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                executionService.execute("user-editor", "p-1", request));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertTrue(ex.getReason().contains("Total files payload exceeds maximum size of 1 MB"));
    }

    @Test
    void hourlyQuotaExceededThrowsTooManyRequests() {
        Project project = new Project();
        project.setId("p-1");
        when(projectService.requireAccess("user-editor", "p-1"))
                .thenReturn(new ProjectService.Access(project, Role.EDITOR));

        org.mockito.Mockito.doNothing().when(rateLimitService).check("exec:user-editor");
        doThrow(new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Hourly quota exceeded"))
                .when(rateLimitService).check(eq("exec-hourly:user-editor"), eq(60), eq(Duration.ofHours(1)));

        ExecutionRequest request = new ExecutionRequest(
                "python",
                "script.py",
                List.of(new ExecutionFile("script.py", "print(1)"))
        );

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                executionService.execute("user-editor", "p-1", request));

        assertEquals(HttpStatus.TOO_MANY_REQUESTS, ex.getStatusCode());
        assertEquals("Hourly quota exceeded", ex.getReason());
    }

    @Test
    void concurrentRunCapExceededThrowsTooManyRequests() {
        Project project = new Project();
        project.setId("p-1");
        when(projectService.requireAccess("user-editor", "p-1"))
                .thenReturn(new ProjectService.Access(project, Role.EDITOR));

        // Simulate an already active execution by artificially setting the user's active counter to 1
        @SuppressWarnings("unchecked")
        java.util.concurrent.ConcurrentHashMap<String, java.util.concurrent.atomic.AtomicInteger> runs =
                (java.util.concurrent.ConcurrentHashMap<String, java.util.concurrent.atomic.AtomicInteger>)
                        ReflectionTestUtils.getField(executionService, "userConcurrentRuns");
        runs.put("user-editor", new java.util.concurrent.atomic.AtomicInteger(1));

        ExecutionRequest request = new ExecutionRequest(
                "python",
                "script.py",
                List.of(new ExecutionFile("script.py", "print(1)"))
        );

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                executionService.execute("user-editor", "p-1", request));

        assertEquals(HttpStatus.TOO_MANY_REQUESTS, ex.getStatusCode());
        assertTrue(ex.getReason().contains("Concurrent execution limit reached"));
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

    @Test
    void missingServiceTokenThrowsServiceUnavailable() {
        ReflectionTestUtils.setField(executionService, "executionServiceToken", "");

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
        assertEquals("Code execution authentication is not configured. Configure APP_EXECUTION_SERVICE_TOKEN.", ex.getReason());
    }
}
