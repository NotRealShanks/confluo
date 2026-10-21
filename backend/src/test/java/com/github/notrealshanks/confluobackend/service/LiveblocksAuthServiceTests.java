package com.github.notrealshanks.confluobackend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.github.notrealshanks.confluobackend.security.GuestPrincipal;
import com.github.notrealshanks.confluobackend.repository.UserRepository;

class LiveblocksAuthServiceTests {

    @Test
    void guestCannotAuthorizeAnotherProjectRoom() {
        LiveblocksAuthService service = new LiveblocksAuthService(
                mock(ProjectService.class), mock(UserRepository.class),
                "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=");

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.authorizeGuest(
                        new GuestPrincipal("guest-1", "project-1", "link-1"), "project-2"));

        assertEquals(HttpStatus.NOT_FOUND, error.getStatusCode());
    }
}
