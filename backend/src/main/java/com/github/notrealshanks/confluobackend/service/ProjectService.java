package com.github.notrealshanks.confluobackend.service;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.github.notrealshanks.confluobackend.dto.CreateProjectRequest;
import com.github.notrealshanks.confluobackend.dto.ProjectResponse;
import com.github.notrealshanks.confluobackend.model.ProjectMember;
import com.github.notrealshanks.confluobackend.model.Project;
import com.github.notrealshanks.confluobackend.model.Role;
import com.github.notrealshanks.confluobackend.repository.ProjectRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProjectService {

    public record Access(Project project, Role role) {
    }

    private final ProjectRepository projectRepository;

    public ProjectResponse create(String userId, CreateProjectRequest request) {
        Instant now = Instant.now();
        Project project = new Project();
        project.setTitle(request.title().trim());
        project.getMembers().add(new ProjectMember(userId, Role.OWNER));
        project.setCreatedAt(now);
        project.setUpdatedAt(now);
        return toResponse(projectRepository.save(project), Role.OWNER);
    }

    public List<ProjectResponse> listFor(String userId) {
        return projectRepository.findByMembersUserId(userId).stream()
                .flatMap(project -> project.roleOf(userId).map(role -> toResponse(project, role)).stream())
                .sorted(Comparator.comparing(ProjectResponse::updatedAt).reversed())
                .toList();
    }

    public ProjectResponse get(String userId, String projectId) {
        Access access = requireAccess(userId, projectId);
        return toResponse(access.project(), access.role());
    }

    // Shared by every project endpoint; non-members get 404 so IDs can't be probed
    public Access requireAccess(String userId, String projectId) {
        return projectRepository.findById(projectId)
                .flatMap(project -> project.roleOf(userId).map(role -> new Access(project, role)))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));
    }

    private static ProjectResponse toResponse(Project project, Role role) {
        return new ProjectResponse(project.getId(), project.getTitle(), role, project.getCreatedAt(), project.getUpdatedAt());
    }
}
