package com.github.notrealshanks.confluobackend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.github.notrealshanks.confluobackend.dto.CreateProjectRequest;
import com.github.notrealshanks.confluobackend.dto.ProjectResponse;
import com.github.notrealshanks.confluobackend.security.GuestPrincipal;
import com.github.notrealshanks.confluobackend.service.ProjectService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @PostMapping
    public ResponseEntity<ProjectResponse> create(
            Authentication authentication, @Valid @RequestBody CreateProjectRequest request) {
        rejectGuest(authentication);
        // JwtAuthFilter sets the user id as the principal name
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(projectService.create(authentication.getName(), request));
    }

    @GetMapping
    public List<ProjectResponse> list(Authentication authentication) {
        rejectGuest(authentication);
        return projectService.listFor(authentication.getName());
    }

    @GetMapping("/{id}")
    public ProjectResponse get(Authentication authentication, @PathVariable String id) {
        if (authentication.getPrincipal() instanceof GuestPrincipal guest) {
            if (!guest.projectId().equals(id)) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Project not found");
            }
            return projectService.getGuest(id);
        }
        return projectService.get(authentication.getName(), id);
    }

    private static void rejectGuest(Authentication authentication) {
        if (authentication.getPrincipal() instanceof GuestPrincipal) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Guest access is read-only and project-scoped");
        }
    }
}
