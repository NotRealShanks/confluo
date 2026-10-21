package com.github.notrealshanks.confluobackend.service;

import java.util.Optional;

import com.github.notrealshanks.confluobackend.model.Project;
import com.github.notrealshanks.confluobackend.model.ProjectMember;
import com.github.notrealshanks.confluobackend.model.Role;
import com.github.notrealshanks.confluobackend.repository.ProjectRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProjectServiceAuthorizationTests {

    @Mock
    private ProjectRepository projectRepository;

    private ProjectService projectService;

    @BeforeEach
    void setUp() {
        projectService = new ProjectService(projectRepository);
    }

    @Test
    void memberCanAccessProjectWithTheirOwnRole() {
        Project project = new Project();
        project.setId("project-1");
        project.setTitle("Confluo");
        project.getMembers().add(new ProjectMember("user-1", Role.EDITOR));

        when(projectRepository.findById("project-1"))
                .thenReturn(Optional.of(project));

        ProjectService.Access access =
                projectService.requireAccess("user-1", "project-1");

        assertEquals(project, access.project());
        assertEquals(Role.EDITOR, access.role());
        verify(projectRepository).findById("project-1");
    }

    @Test
    void nonMemberCannotAccessProject() {
        Project project = new Project();
        project.setId("project-1");
        project.getMembers().add(new ProjectMember("owner-1", Role.OWNER));

        when(projectRepository.findById("project-1"))
                .thenReturn(Optional.of(project));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> projectService.requireAccess("outsider", "project-1"));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
    }

    @Test
    void nonexistentProjectReturnsNotFound() {
        when(projectRepository.findById("missing-project"))
                .thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> projectService.requireAccess("user-1", "missing-project"));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
    }
}
