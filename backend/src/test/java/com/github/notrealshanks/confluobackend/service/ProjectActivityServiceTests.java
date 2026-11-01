package com.github.notrealshanks.confluobackend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.github.notrealshanks.confluobackend.dto.AddMemberRequest;
import com.github.notrealshanks.confluobackend.dto.MemberResponse;
import com.github.notrealshanks.confluobackend.dto.ProjectActivityPageResponse;
import com.github.notrealshanks.confluobackend.model.Project;
import com.github.notrealshanks.confluobackend.model.ProjectActivity;
import com.github.notrealshanks.confluobackend.model.ProjectActivityType;
import com.github.notrealshanks.confluobackend.model.ProjectMember;
import com.github.notrealshanks.confluobackend.model.Role;
import com.github.notrealshanks.confluobackend.model.User;
import com.github.notrealshanks.confluobackend.repository.ProjectActivityRepository;
import com.github.notrealshanks.confluobackend.repository.ProjectRepository;
import com.github.notrealshanks.confluobackend.repository.UserRepository;

class ProjectActivityServiceTests {

    private ProjectActivityRepository projectActivityRepository;
    private ProjectService projectService;
    private UserRepository userRepository;
    private ProjectRepository projectRepository;
    private LiveblocksAuthService liveblocksAuthService;

    private ProjectActivityService projectActivityService;
    private MemberService memberService;

    @BeforeEach
    void setUp() {
        projectActivityRepository = mock(ProjectActivityRepository.class);
        projectService = mock(ProjectService.class);
        userRepository = mock(UserRepository.class);
        projectRepository = mock(ProjectRepository.class);
        liveblocksAuthService = mock(LiveblocksAuthService.class);

        projectActivityService = new ProjectActivityService(projectActivityRepository, projectService, userRepository);
        memberService = new MemberService(projectService, projectRepository, userRepository, liveblocksAuthService, projectActivityService);
    }

    @Test
    void activityIsPersistedAfterSuccessfulMemberInvitation() {
        Project project = new Project();
        project.setId("proj-1");
        project.getMembers().add(new ProjectMember("owner-id", Role.OWNER));

        when(projectService.requireAccess("owner-id", "proj-1"))
                .thenReturn(new ProjectService.Access(project, Role.OWNER));

        User targetUser = new User();
        targetUser.setId("invitee-id");
        targetUser.setEmail("invitee@example.com");
        targetUser.setName("Bob Invitee");

        when(userRepository.findByEmail("invitee@example.com")).thenReturn(Optional.of(targetUser));

        MemberResponse response = memberService.add("owner-id", "proj-1", new AddMemberRequest("invitee@example.com", Role.EDITOR));
        assertNotNull(response);
        assertEquals("invitee-id", response.userId());

        // Verify that ProjectActivityRepository saved the MEMBER_INVITED event
        verify(projectActivityRepository).save(argThat(act ->
                "proj-1".equals(act.getProjectId()) &&
                "owner-id".equals(act.getActorId()) &&
                act.getActionType() == ProjectActivityType.MEMBER_INVITED &&
                "invitee-id".equals(act.getTargetUserId()) &&
                "EDITOR".equals(act.getMetadata().get("role"))
        ));
    }

    @Test
    void activityIsPersistedAfterSuccessfulInvitationAcceptance() {
        Project project = new Project();
        project.setId("proj-1");
        project.getMembers().add(new ProjectMember("user-1", Role.EDITOR));

        when(projectService.requireAccess("user-1", "proj-1"))
                .thenReturn(new ProjectService.Access(project, Role.EDITOR));

        memberService.acceptInvitation("user-1", "proj-1");

        // Verify that ProjectActivityRepository saved the MEMBER_JOINED event
        verify(projectActivityRepository).save(argThat(act ->
                "proj-1".equals(act.getProjectId()) &&
                "user-1".equals(act.getActorId()) &&
                act.getActionType() == ProjectActivityType.MEMBER_JOINED &&
                act.getTargetUserId() == null &&
                "EDITOR".equals(act.getMetadata().get("role"))
        ));
    }

    @Test
    void activityIsPersistedAfterMemberRemoval() {
        Project project = new Project();
        project.setId("proj-1");
        project.getMembers().add(new ProjectMember("owner-id", Role.OWNER));
        project.getMembers().add(new ProjectMember("member-id", Role.EDITOR));

        when(projectService.requireAccess("owner-id", "proj-1"))
                .thenReturn(new ProjectService.Access(project, Role.OWNER));

        memberService.remove("owner-id", "proj-1", "member-id");

        verify(projectActivityRepository).save(argThat(act ->
                "proj-1".equals(act.getProjectId()) &&
                "owner-id".equals(act.getActorId()) &&
                act.getActionType() == ProjectActivityType.MEMBER_REMOVED &&
                "member-id".equals(act.getTargetUserId()) &&
                "EDITOR".equals(act.getMetadata().get("role"))
        ));
    }

    @Test
    void activityIsPersistedAfterMemberLeavingVoluntarily() {
        Project project = new Project();
        project.setId("proj-1");
        project.getMembers().add(new ProjectMember("owner-id", Role.OWNER));
        project.getMembers().add(new ProjectMember("member-id", Role.EDITOR));

        // When caller removes themselves
        when(projectService.requireAccess("member-id", "proj-1"))
                .thenReturn(new ProjectService.Access(project, Role.EDITOR));

        memberService.remove("member-id", "proj-1", "member-id");

        verify(projectActivityRepository).save(argThat(act ->
                "proj-1".equals(act.getProjectId()) &&
                "member-id".equals(act.getActorId()) &&
                act.getActionType() == ProjectActivityType.MEMBER_LEFT &&
                act.getTargetUserId() == null
        ));
    }

    @Test
    void activityIsPersistedAfterRoleUpdate() {
        Project project = new Project();
        project.setId("proj-1");
        project.getMembers().add(new ProjectMember("owner-id", Role.OWNER));
        project.getMembers().add(new ProjectMember("target-id", Role.VIEWER));

        when(projectService.requireAccess("owner-id", "proj-1"))
                .thenReturn(new ProjectService.Access(project, Role.OWNER));

        memberService.updateRole("owner-id", "proj-1", "target-id", Role.EDITOR);

        verify(projectActivityRepository).save(argThat(act ->
                "proj-1".equals(act.getProjectId()) &&
                "owner-id".equals(act.getActorId()) &&
                act.getActionType() == ProjectActivityType.MEMBER_ROLE_UPDATED &&
                "target-id".equals(act.getTargetUserId()) &&
                "VIEWER".equals(act.getMetadata().get("previousRole")) &&
                "EDITOR".equals(act.getMetadata().get("newRole"))
        ));
    }

    @Test
    void unauthorizedUserCannotAccessActivity() {
        when(projectService.requireAccess("unauth-user", "proj-1"))
                .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                projectActivityService.listActivities("unauth-user", "proj-1", 0, 20));

        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
        verify(projectActivityRepository, never()).findByProjectIdOrderByTimestampDesc(any(), any());
    }

    @Test
    void paginationWorksCorrectly() {
        Project project = new Project();
        project.setId("proj-1");
        when(projectService.requireAccess("user-1", "proj-1"))
                .thenReturn(new ProjectService.Access(project, Role.EDITOR));

        Instant now = Instant.now();
        ProjectActivity act1 = ProjectActivity.builder()
                .id("act-1")
                .projectId("proj-1")
                .actorId("user-1")
                .actionType(ProjectActivityType.MEMBER_INVITED)
                .targetUserId("user-2")
                .timestamp(now)
                .build();

        when(projectActivityRepository.findByProjectIdOrderByTimestampDesc(eq("proj-1"), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(act1), PageRequest.of(0, 20), 1));

        User user1 = new User();
        user1.setId("user-1");
        user1.setName("Alice");

        User user2 = new User();
        user2.setId("user-2");
        user2.setName("Bob");

        when(userRepository.findAllById(any())).thenReturn(List.of(user1, user2));

        ProjectActivityPageResponse response = projectActivityService.listActivities("user-1", "proj-1", 0, 20);
        assertEquals(1, response.activities().size());
        assertEquals("act-1", response.activities().get(0).id());
        assertEquals("Alice", response.activities().get(0).actorName());
        assertEquals("Bob", response.activities().get(0).targetUserName());
        assertEquals(0, response.page());
        assertEquals(20, response.size());
        assertEquals(1, response.totalElements());
    }

    @Test
    void activityIsNotRecordedWhenOperationFails() {
        Project project = new Project();
        project.setId("proj-1");
        project.getMembers().add(new ProjectMember("owner-id", Role.OWNER));

        when(projectService.requireAccess("owner-id", "proj-1"))
                .thenReturn(new ProjectService.Access(project, Role.OWNER));

        // When user is not found
        when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());

        assertThrows(ResponseStatusException.class, () ->
                memberService.add("owner-id", "proj-1", new AddMemberRequest("missing@example.com", Role.EDITOR)));

        // No activity should be recorded
        verify(projectActivityRepository, never()).save(any());
    }

    @Test
    void duplicateEventsFromRetriesArePrevented() {
        // Test repeated MEMBER_JOINED
        when(projectActivityRepository.existsByProjectIdAndActionTypeAndActorId("proj-1", ProjectActivityType.MEMBER_JOINED, "user-1"))
                .thenReturn(true);

        projectActivityService.recordActivity("proj-1", "user-1", ProjectActivityType.MEMBER_JOINED, null, Map.of());

        // Save should be skipped because user already joined
        verify(projectActivityRepository, never()).save(any());
    }

    @Test
    void activityLoggingFailureDoesNotBreakMemberOperation() {
        Project project = new Project();
        project.setId("proj-1");
        project.getMembers().add(new ProjectMember("owner-id", Role.OWNER));

        when(projectService.requireAccess("owner-id", "proj-1"))
                .thenReturn(new ProjectService.Access(project, Role.OWNER));

        User targetUser = new User();
        targetUser.setId("invitee-id");
        targetUser.setEmail("invitee@example.com");
        when(userRepository.findByEmail("invitee@example.com")).thenReturn(Optional.of(targetUser));

        // Mock database exception when saving activity
        doThrow(new RuntimeException("Database error")).when(projectActivityRepository).save(any());

        // Member addition should still succeed gracefully
        MemberResponse response = memberService.add("owner-id", "proj-1", new AddMemberRequest("invitee@example.com", Role.EDITOR));
        assertNotNull(response);
        assertEquals("invitee-id", response.userId());
    }
}

