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

    public List<MemberResponse> list(String callerId, String projectId) {
        Project project = requireOwner(callerId, projectId);
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
            throw new ResponseStatusException(HttpStatus.CONFLICT, "The owner can't be removed");
        }

        saveMembers(project, project.getMembers().stream().filter(m -> !m.userId().equals(targetUserId)).toList());
    }

    // Non-members get 404 from requireAccess; members without the right role get 403
    private Project requireOwner(String callerId, String projectId) {
        Access access = projectService.requireAccess(callerId, projectId);
        if (!access.role().canManageMembers()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the owner can manage members");
        }
        return access.project();
    }

    private static void requireAssignable(Role role) {
        if (role == Role.OWNER) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role must be EDITOR or VIEWER");
        }
    }

    private void saveMembers(Project project, List<ProjectMember> members) {
        project.setMembers(new ArrayList<>(members));
        project.setUpdatedAt(Instant.now());
        projectRepository.save(project);
    }

    // user is null if the account was deleted after being added
    private static MemberResponse toResponse(ProjectMember member, User user) {
        return new MemberResponse(
                member.userId(),
                user == null ? "Unknown user" : user.getName(),
                user == null ? null : user.getEmail(),
                member.role());
    }
}
