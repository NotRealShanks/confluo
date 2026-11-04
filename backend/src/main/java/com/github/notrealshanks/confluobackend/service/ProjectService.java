package com.github.notrealshanks.confluobackend.service;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.github.notrealshanks.confluobackend.dto.CreateProjectRequest;
import com.github.notrealshanks.confluobackend.dto.ProjectResponse;
import com.github.notrealshanks.confluobackend.model.ProjectMember;
import com.github.notrealshanks.confluobackend.model.Project;
import com.github.notrealshanks.confluobackend.model.ProjectActivityType;
import com.github.notrealshanks.confluobackend.model.Role;
import com.github.notrealshanks.confluobackend.repository.ProjectRepository;

@Service
public class ProjectService {

    public record Access(Project project, Role role) {
    }

    private final ProjectRepository projectRepository;
    private final LiveblocksAuthService liveblocksAuthService;
    private final ProjectActivityService projectActivityService;

    @org.springframework.beans.factory.annotation.Autowired
    public ProjectService(
            ProjectRepository projectRepository,
            @Lazy LiveblocksAuthService liveblocksAuthService,
            @Lazy ProjectActivityService projectActivityService) {
        this.projectRepository = projectRepository;
        this.liveblocksAuthService = liveblocksAuthService;
        this.projectActivityService = projectActivityService;
    }

    public ProjectService(ProjectRepository projectRepository) {
        this(projectRepository, null, null);
    }

    public ProjectResponse create(String userId, CreateProjectRequest request) {
        Instant now = Instant.now();
        Project project = new Project();
        project.setTitle(request.title().trim());
        if (request.templateId() != null && !request.templateId().isBlank()) {
            project.setTemplateId(request.templateId().trim());
        }
        if (request.templateConfig() != null && !request.templateConfig().isBlank()) {
            project.setTemplateConfig(request.templateConfig().trim());
        }
        project.getMembers().add(new ProjectMember(userId, Role.OWNER));
        project.setCreatedAt(now);
        project.setUpdatedAt(now);
        return toResponse(projectRepository.save(project), Role.OWNER);
    }

    public void delete(String userId, String projectId) {
        Access access = requireAccess(userId, projectId);
        if (access.role() != Role.OWNER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the project owner can delete this project");
        }
        Project project = access.project();
        Instant now = Instant.now();
        project.setDeletedAt(now);
        project.setUpdatedAt(now);
        projectRepository.save(project);

        if (liveblocksAuthService != null) {
            for (ProjectMember member : project.getMembers()) {
                if (member.userId() != null) {
                    liveblocksAuthService.revokeRoomAccess(projectId, member.userId());
                }
            }
        }

        if (projectActivityService != null) {
            projectActivityService.recordActivity(
                    projectId,
                    userId,
                    ProjectActivityType.PROJECT_DELETED,
                    null,
                    Map.of()
            );
        }
    }

    public List<ProjectResponse> listFor(String userId) {
        return projectRepository.findByMembersUserId(userId).stream()
                .filter(p -> !p.isDeleted())
                .flatMap(project -> project.roleOf(userId).map(role -> toResponse(project, role)).stream())
                .sorted(Comparator.comparing(ProjectResponse::updatedAt).reversed())
                .toList();
    }

    public ProjectResponse get(String userId, String projectId) {
        Access access = requireAccess(userId, projectId);
        return toResponse(access.project(), access.role());
    }

    public ProjectResponse getGuest(String projectId) {
        Project project = requireProject(projectId);
        return toResponse(project, Role.VIEWER);
    }

    public Project requireProject(String projectId) {
        return projectRepository.findById(projectId)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));
    }

    // Shared by every project endpoint; non-members get 404 so IDs can't be probed
    public Access requireAccess(String userId, String projectId) {
        return projectRepository.findById(projectId)
                .filter(p -> !p.isDeleted())
                .flatMap(project -> project.roleOf(userId).map(role -> new Access(project, role)))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));
    }

    private static ProjectResponse toResponse(Project project, Role role) {
        return new ProjectResponse(project.getId(), project.getTitle(), role, project.getTemplateId(), project.getTemplateConfig(), project.getCreatedAt(), project.getUpdatedAt());
    }
}
