package com.github.notrealshanks.confluobackend.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.server.ResponseStatusException;

import com.github.notrealshanks.confluobackend.dto.ProjectActivityPageResponse;
import com.github.notrealshanks.confluobackend.dto.ProjectActivityResponse;
import com.github.notrealshanks.confluobackend.model.ProjectActivityType;
import com.github.notrealshanks.confluobackend.security.GuestPrincipal;
import com.github.notrealshanks.confluobackend.service.ProjectActivityService;

class ProjectActivityControllerTests {

    private ProjectActivityService projectActivityService;
    private ProjectActivityController projectActivityController;

    private final Authentication memberAuth = UsernamePasswordAuthenticationToken.authenticated(
            "user-1", null, List.of());
    private final Authentication guestAuth = UsernamePasswordAuthenticationToken.authenticated(
            new GuestPrincipal("guest-1", "project-1", "link-1"), null, List.of());

    @BeforeEach
    void setUp() {
        projectActivityService = mock(ProjectActivityService.class);
        projectActivityController = new ProjectActivityController(projectActivityService);
    }

    @Test
    void authenticatedMemberCanListActivities() {
        ProjectActivityResponse act = new ProjectActivityResponse(
                "act-1", "project-1", "user-1", "Alice",
                ProjectActivityType.MEMBER_INVITED, "user-2", "Bob", Map.of(), Instant.now());
        ProjectActivityPageResponse page = new ProjectActivityPageResponse(
                List.of(act), 0, 20, 1, 1, false);

        when(projectActivityService.listActivities("user-1", "project-1", 0, 20)).thenReturn(page);

        ProjectActivityPageResponse result = projectActivityController.list(memberAuth, "project-1", 0, 20);
        assertEquals(1, result.activities().size());
        assertEquals("act-1", result.activities().get(0).id());
        assertEquals("Alice", result.activities().get(0).actorName());
    }

    @Test
    void guestUserIsRejectedWithForbidden() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                projectActivityController.list(guestAuth, "project-1", 0, 20));

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    void unauthenticatedUserIsRejectedWithUnauthorized() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                projectActivityController.list(null, "project-1", 0, 20));

        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
    }

    @Test
    void actorIdentityIsStrictlyDerivedFromAuthenticationContext() {
        // Calling list with memberAuth passes "user-1" to projectActivityService
        when(projectActivityService.listActivities("user-1", "project-1", 0, 20))
                .thenReturn(new ProjectActivityPageResponse(List.of(), 0, 20, 0, 0, false));

        projectActivityController.list(memberAuth, "project-1", 0, 20);
        org.mockito.Mockito.verify(projectActivityService).listActivities("user-1", "project-1", 0, 20);
    }
}

