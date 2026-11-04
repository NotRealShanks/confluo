package com.github.notrealshanks.confluobackend.service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.github.notrealshanks.confluobackend.model.Project;
import com.github.notrealshanks.confluobackend.model.ProjectActivityType;
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
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProjectServiceAuthorizationTests {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private LiveblocksAuthService liveblocksAuthService;

    @Mock
    private ProjectActivityService projectActivityService;

    private ProjectService projectService;

    @BeforeEach
    void setUp() {
        projectService = new ProjectService(projectRepository, liveblocksAuthService, projectActivityService);
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

    @Test
    void deletedProjectReturnsNotFound() {
        Project project = new Project();
        project.setId("project-1");
        project.setDeletedAt(Instant.now());
        project.getMembers().add(new ProjectMember("user-1", Role.OWNER));

        when(projectRepository.findById("project-1"))
                .thenReturn(Optional.of(project));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> projectService.requireAccess("user-1", "project-1"));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
    }

    @Test
    void ownerCanDeleteProjectSoftly() {
        Project project = new Project();
        project.setId("project-1");
        project.getMembers().add(new ProjectMember("owner-1", Role.OWNER));
        project.getMembers().add(new ProjectMember("editor-1", Role.EDITOR));

        when(projectRepository.findById("project-1"))
                .thenReturn(Optional.of(project));

        projectService.delete("owner-1", "project-1");

        assertTrue(project.isDeleted());
        assertNotNull(project.getDeletedAt());
        verify(projectRepository).save(project);
        verify(liveblocksAuthService).revokeRoomAccess("project-1", "owner-1");
        verify(liveblocksAuthService).revokeRoomAccess("project-1", "editor-1");
        verify(projectActivityService).recordActivity("project-1", "owner-1", ProjectActivityType.PROJECT_DELETED, null, Map.of());
    }

    @Test
    void nonOwnerCannotDeleteProject() {
        Project project = new Project();
        project.setId("project-1");
        project.getMembers().add(new ProjectMember("editor-1", Role.EDITOR));

        when(projectRepository.findById("project-1"))
                .thenReturn(Optional.of(project));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> projectService.delete("editor-1", "project-1"));

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
    }

    @Test
    void listForExcludesDeletedProjects() {
        Project activeProject = new Project();
        activeProject.setId("active-1");
        activeProject.setTitle("Active");
        activeProject.setCreatedAt(Instant.now());
        activeProject.setUpdatedAt(Instant.now());
        activeProject.getMembers().add(new ProjectMember("user-1", Role.OWNER));

        Project deletedProject = new Project();
        deletedProject.setId("deleted-1");
        deletedProject.setTitle("Deleted");
        deletedProject.setDeletedAt(Instant.now());
        deletedProject.setCreatedAt(Instant.now());
        deletedProject.setUpdatedAt(Instant.now());
        deletedProject.getMembers().add(new ProjectMember("user-1", Role.OWNER));

        when(projectRepository.findByMembersUserId("user-1"))
                .thenReturn(List.of(activeProject, deletedProject));

        var list = projectService.listFor("user-1");
        assertEquals(1, list.size());
        assertEquals("active-1", list.get(0).id());
    }
}
