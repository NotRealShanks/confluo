package com.github.notrealshanks.confluobackend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.github.notrealshanks.confluobackend.dto.ProfileUpdateRequest;
import com.github.notrealshanks.confluobackend.model.User;
import com.github.notrealshanks.confluobackend.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class UserServiceTests {
    @Mock private UserRepository users;
    private UserService service;

    @BeforeEach void setUp() { service = new UserService(users); }

    @Test void updatesOnlyTheAuthenticatedUsersDisplayName() {
        User user = new User(); user.setId("current-user"); user.setName("Before"); user.setEmail("user@example.com"); user.setProvider("github"); user.setProviderId("provider-id");
        when(users.findById("current-user")).thenReturn(Optional.of(user));
        when(users.save(user)).thenReturn(user);

        var response = service.updateProfile("current-user", new ProfileUpdateRequest(" Updated name "));

        assertEquals("Updated name", response.name());
        assertEquals("user@example.com", response.email());
        assertEquals("provider-id", user.getProviderId());
        verify(users).save(user);
    }

    @Test void rejectsAProfileUpdateForAnUnknownPrincipal() {
        when(users.findById("missing")).thenReturn(Optional.empty());
        var error = assertThrows(ResponseStatusException.class, () -> service.updateProfile("missing", new ProfileUpdateRequest("Name")));
        assertEquals(HttpStatus.UNAUTHORIZED, error.getStatusCode());
    }
}
