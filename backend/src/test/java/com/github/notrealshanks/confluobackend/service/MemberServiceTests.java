package com.github.notrealshanks.confluobackend.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.github.notrealshanks.confluobackend.model.Project;
import com.github.notrealshanks.confluobackend.model.ProjectActivityType;
import com.github.notrealshanks.confluobackend.model.ProjectMember;
import com.github.notrealshanks.confluobackend.model.Role;
import com.github.notrealshanks.confluobackend.repository.ProjectRepository;
import com.github.notrealshanks.confluobackend.repository.UserRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MemberServiceTests {

    @Mock
    private ProjectService projectService;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private LiveblocksAuthService liveblocksAuthService;

    @Mock
    private ProjectActivityService projectActivityService;

    private MemberService memberService;

    @BeforeEach
    void setUp() {
        memberService = new MemberService(
                projectService,
                projectRepository,
                userRepository,
                liveblocksAuthService,
                projectActivityService);
    }

    @Test
    void transferOwnershipSuccessfullyChangesRolesAndRecordsActivity() {
        Project project = new Project();
        project.setId("p1");
        project.getMembers().add(new ProjectMember("owner-1", Role.OWNER));
        project.getMembers().add(new ProjectMember("editor-1", Role.EDITOR));

        when(projectService.requireAccess("owner-1", "p1"))
                .thenReturn(new ProjectService.Access(project, Role.OWNER));

        memberService.transferOwnership("owner-1", "p1", "editor-1");

        ArgumentCaptor<Project> captor = ArgumentCaptor.forClass(Project.class);
        verify(projectRepository).save(captor.capture());

        Project saved = captor.getValue();
        assertEquals(Role.EDITOR, saved.roleOf("owner-1").orElseThrow());
        assertEquals(Role.OWNER, saved.roleOf("editor-1").orElseThrow());

        verify(projectActivityService).recordActivity(
                "p1",
                "owner-1",
                ProjectActivityType.OWNERSHIP_TRANSFERRED,
                "editor-1",
                Map.of("previousRole", "EDITOR")
        );
    }

    @Test
    void transferOwnershipToSelfThrowsBadRequest() {
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> memberService.transferOwnership("owner-1", "p1", "owner-1"));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertEquals("Cannot transfer ownership to yourself", ex.getReason());
    }

    @Test
    void transferOwnershipByNonOwnerThrowsForbidden() {
        Project project = new Project();
        project.setId("p1");
        project.getMembers().add(new ProjectMember("owner-1", Role.OWNER));
        project.getMembers().add(new ProjectMember("editor-1", Role.EDITOR));

        when(projectService.requireAccess("editor-1", "p1"))
                .thenReturn(new ProjectService.Access(project, Role.EDITOR));

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> memberService.transferOwnership("editor-1", "p1", "other"));

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    void transferOwnershipToNonMemberThrowsNotFound() {
        Project project = new Project();
        project.setId("p1");
        project.getMembers().add(new ProjectMember("owner-1", Role.OWNER));

        when(projectService.requireAccess("owner-1", "p1"))
                .thenReturn(new ProjectService.Access(project, Role.OWNER));

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> memberService.transferOwnership("owner-1", "p1", "non-member"));

        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }

    @Test
    void ownerLeavingWithoutTransferThrowsConflict() {
        Project project = new Project();
        project.setId("p1");
        project.getMembers().add(new ProjectMember("owner-1", Role.OWNER));
        project.getMembers().add(new ProjectMember("editor-1", Role.EDITOR));

        when(projectService.requireAccess("owner-1", "p1"))
                .thenReturn(new ProjectService.Access(project, Role.OWNER));

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> memberService.remove("owner-1", "p1", "owner-1"));

        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
        assertEquals("Transfer ownership before leaving the project", ex.getReason());
    }

    @Test
    void nonOwnerRemovingOwnerThrowsConflict() {
        Project project = new Project();
        project.setId("p1");
        project.getMembers().add(new ProjectMember("owner-1", Role.OWNER));
        project.getMembers().add(new ProjectMember("editor-1", Role.EDITOR));

        when(projectService.requireAccess("owner-1", "p1"))
                .thenReturn(new ProjectService.Access(project, Role.OWNER));

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> memberService.remove("owner-1", "p1", "owner-1"));

        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
    }

    @Test
    void memberVoluntaryLeaveSucceeds() {
        Project project = new Project();
        project.setId("p1");
        project.getMembers().add(new ProjectMember("owner-1", Role.OWNER));
        project.getMembers().add(new ProjectMember("editor-1", Role.EDITOR));

        when(projectService.requireAccess("editor-1", "p1"))
                .thenReturn(new ProjectService.Access(project, Role.EDITOR));

        memberService.remove("editor-1", "p1", "editor-1");

        ArgumentCaptor<Project> captor = ArgumentCaptor.forClass(Project.class);
        verify(projectRepository).save(captor.capture());
        Project saved = captor.getValue();
        assertEquals(1, saved.getMembers().size());
        assertEquals("owner-1", saved.getMembers().get(0).userId());

        verify(liveblocksAuthService).revokeRoomAccess("p1", "editor-1");
        verify(projectActivityService).recordActivity("p1", "editor-1", ProjectActivityType.MEMBER_LEFT, null, Map.of("role", "EDITOR"));
    }
}

