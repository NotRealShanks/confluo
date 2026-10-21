package com.github.notrealshanks.confluobackend.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.server.ResponseStatusException;

import com.github.notrealshanks.confluobackend.dto.CreateProjectRequest;
import com.github.notrealshanks.confluobackend.dto.CreateShareLinkRequest;
import com.github.notrealshanks.confluobackend.dto.AddMemberRequest;
import com.github.notrealshanks.confluobackend.security.GuestPrincipal;
import com.github.notrealshanks.confluobackend.service.MemberService;
import com.github.notrealshanks.confluobackend.service.ProjectService;
import com.github.notrealshanks.confluobackend.service.ShareLinkService;

class GuestAuthorizationControllerTests {

    private final Authentication guest = UsernamePasswordAuthenticationToken.authenticated(
            new GuestPrincipal("guest-1", "project-1", "link-1"), null, java.util.List.of());

    @Test
    void guestCannotCreateProjectOrListProjects() {
        ProjectController controller = new ProjectController(mock(ProjectService.class));

        ResponseStatusException createError = assertThrows(ResponseStatusException.class,
                () -> controller.create(guest, new CreateProjectRequest("new project")));
        ResponseStatusException listError = assertThrows(ResponseStatusException.class,
                () -> controller.list(guest));

        assertEquals(HttpStatus.FORBIDDEN, createError.getStatusCode());
        assertEquals(HttpStatus.FORBIDDEN, listError.getStatusCode());
    }

    @Test
    void guestCannotManageMembersOrShareLinks() {
        MemberController memberController = new MemberController(mock(MemberService.class));
        ShareLinkController linkController = new ShareLinkController(mock(ShareLinkService.class));

        ResponseStatusException memberError = assertThrows(ResponseStatusException.class,
                () -> memberController.add(guest, "project-1",
                        new AddMemberRequest("user@example.com", com.github.notrealshanks.confluobackend.model.Role.VIEWER)));
        ResponseStatusException linkError = assertThrows(ResponseStatusException.class,
                () -> linkController.create(guest, "project-1", new CreateShareLinkRequest(null)));

        assertEquals(HttpStatus.FORBIDDEN, memberError.getStatusCode());
        assertEquals(HttpStatus.FORBIDDEN, linkError.getStatusCode());
    }

    @Test
    void guestCannotReadAnotherProject() {
        ProjectController controller = new ProjectController(mock(ProjectService.class));

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> controller.get(guest, "project-2"));

        assertEquals(HttpStatus.NOT_FOUND, error.getStatusCode());
    }
}
