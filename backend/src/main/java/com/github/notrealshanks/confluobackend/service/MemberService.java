package com.github.notrealshanks.confluobackend.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.github.notrealshanks.confluobackend.dto.AddMemberRequest;
import com.github.notrealshanks.confluobackend.dto.MemberResponse;
import com.github.notrealshanks.confluobackend.model.ProjectMember;
import com.github.notrealshanks.confluobackend.model.Project;
import com.github.notrealshanks.confluobackend.model.ProjectActivityType;
import com.github.notrealshanks.confluobackend.model.Role;
import com.github.notrealshanks.confluobackend.model.User;
import com.github.notrealshanks.confluobackend.repository.ProjectRepository;
import com.github.notrealshanks.confluobackend.repository.UserRepository;
import com.github.notrealshanks.confluobackend.service.ProjectService.Access;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MemberService {

    private final ProjectService projectService;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final LiveblocksAuthService liveblocksAuthService;
    private final ProjectActivityService projectActivityService;

    public List<MemberResponse> list(String callerId, String projectId) {
        Project project = projectService.requireAccess(callerId, projectId).project();
        List<String> ids = project.getMembers().stream().map(ProjectMember::userId).toList();
        Map<String, User> users = userRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
        return project.getMembers().stream().map(m -> toResponse(m, users.get(m.userId()))).toList();
    }

    public MemberResponse add(String callerId, String projectId, AddMemberRequest request) {
        Project project = requireOwner(callerId, projectId);
        requireAssignable(request.role());

        User target = userRepository.findByEmail(request.email().trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No account with that email"));
        if (project.roleOf(target.getId()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "User already has access");
        }

        ProjectMember member = new ProjectMember(target.getId(), request.role());
        List<ProjectMember> members = new ArrayList<>(project.getMembers());
        members.add(member);
        saveMembers(project, members);

        if (projectActivityService != null) {
            projectActivityService.recordActivity(
                    projectId,
                    callerId,
                    ProjectActivityType.MEMBER_INVITED,
                    target.getId(),
                    Map.of("role", request.role().name())
            );
        }

        if (liveblocksAuthService != null) {
            liveblocksAuthService.notifyProjectInvited(
                    target.getId(),
                    callerId,
                    projectId,
                    project.getTitle(),
                    request.role());
        }

        return toResponse(member, target);
    }

    public MemberResponse updateRole(String callerId, String projectId, String targetUserId, Role role) {
        Project project = requireOwner(callerId, projectId);
        requireAssignable(role);

        Role current = project.roleOf(targetUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Member not found"));
        if (current == Role.OWNER) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "The owner's role can't be changed");
        }

        ProjectMember updated = new ProjectMember(targetUserId, role);
        List<ProjectMember> members = project.getMembers().stream()
                .map(m -> m.userId().equals(targetUserId) ? updated : m)
                .toList();
        saveMembers(project, members);

        if (projectActivityService != null) {
            projectActivityService.recordActivity(
                    projectId,
                    callerId,
                    ProjectActivityType.MEMBER_ROLE_UPDATED,
                    targetUserId,
                    Map.of("previousRole", current.name(), "newRole", role.name())
            );
        }

        if (liveblocksAuthService != null) {
            liveblocksAuthService.notifyProjectRoleChanged(
                    targetUserId,
                    callerId,
                    projectId,
                    project.getTitle(),
                    role);
        }

        return toResponse(updated, userRepository.findById(targetUserId).orElse(null));
    }

    public void remove(String callerId, String projectId, String targetUserId) {
        Access access = projectService.requireAccess(callerId, projectId);
        // Owners can remove anyone else; every member can remove themselves
        if (!callerId.equals(targetUserId) && !access.role().canManageMembers()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the owner can remove other members");
        }

        Project project = access.project();
        Role target = project.roleOf(targetUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Member not found"));
        if (target == Role.OWNER) {
            if (callerId.equals(targetUserId)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Transfer ownership before leaving the project");
            }
            throw new ResponseStatusException(HttpStatus.CONFLICT, "The owner can't be removed");
        }

        saveMembers(project, project.getMembers().stream().filter(m -> !m.userId().equals(targetUserId)).toList());

        // Revoke active Liveblocks session to terminate connection
        if (liveblocksAuthService != null) {
            liveblocksAuthService.revokeRoomAccess(projectId, targetUserId);
            if (!callerId.equals(targetUserId)) {
                liveblocksAuthService.notifyMemberRemoved(
                        targetUserId,
                        callerId,
                        projectId,
                        project.getTitle());
            }
        }

        if (projectActivityService != null) {
            boolean isVoluntaryLeave = callerId.equals(targetUserId);
            projectActivityService.recordActivity(
                    projectId,
                    callerId,
                    isVoluntaryLeave ? ProjectActivityType.MEMBER_LEFT : ProjectActivityType.MEMBER_REMOVED,
                    isVoluntaryLeave ? null : targetUserId,
                    Map.of("role", target.name())
            );
        }
    }

    public void transferOwnership(String callerId, String projectId, String newOwnerId) {
        if (callerId.equals(newOwnerId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot transfer ownership to yourself");
        }

        Project project = requireOwner(callerId, projectId);

        Role targetRole = project.roleOf(newOwnerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Target user is not a member of the project"));

        List<ProjectMember> updatedMembers = project.getMembers().stream()
                .map(m -> {
                    if (m.userId().equals(callerId)) {
                        return new ProjectMember(callerId, Role.EDITOR);
                    }
                    if (m.userId().equals(newOwnerId)) {
                        return new ProjectMember(newOwnerId, Role.OWNER);
                    }
                    return m;
                })
                .toList();

        saveMembers(project, updatedMembers);

        if (liveblocksAuthService != null) {
            liveblocksAuthService.notifyOwnershipTransferred(
                    newOwnerId,
                    callerId,
                    projectId,
                    project.getTitle());
        }

        if (projectActivityService != null) {
            projectActivityService.recordActivity(
                    projectId,
                    callerId,
                    ProjectActivityType.OWNERSHIP_TRANSFERRED,
                    newOwnerId,
                    Map.of("previousRole", targetRole.name())
            );
        }
    }

    public Role roleOf(String userId, String projectId) {
        Access access = projectService.requireAccess(userId, projectId);
        return access.role();
    }

    public void acceptInvitation(String callerId, String projectId) {
        projectService.requireAccess(callerId, projectId);
    }

    private void saveMembers(Project project, List<ProjectMember> members) {
        project.setMembers(members);
        project.setUpdatedAt(Instant.now());
        projectRepository.save(project);
    }

    private static void requireAssignable(Role role) {
        if (role == null || role == Role.OWNER) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role must be EDITOR or VIEWER");
        }
    }

    private Project requireOwner(String callerId, String projectId) {
        Access access = projectService.requireAccess(callerId, projectId);
        if (!access.role().canManageMembers()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the project owner can manage members");
        }
        return access.project();
    }

    private static MemberResponse toResponse(ProjectMember member, User user) {
        return new MemberResponse(
                member.userId(),
                user != null ? user.getName() : null,
                user != null ? user.getEmail() : null,
                member.role()
        );
    }
}
