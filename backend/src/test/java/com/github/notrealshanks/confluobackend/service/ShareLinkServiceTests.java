package com.github.notrealshanks.confluobackend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.github.notrealshanks.confluobackend.dto.CreateShareLinkRequest;
import com.github.notrealshanks.confluobackend.dto.GuestSessionResponse;
import com.github.notrealshanks.confluobackend.model.Project;
import com.github.notrealshanks.confluobackend.model.ProjectMember;
import com.github.notrealshanks.confluobackend.model.Role;
import com.github.notrealshanks.confluobackend.model.ShareLink;
import com.github.notrealshanks.confluobackend.repository.ShareLinkRepository;
import com.github.notrealshanks.confluobackend.security.JwtService;

import jakarta.servlet.http.HttpServletRequest;

@ExtendWith(MockitoExtension.class)
class ShareLinkServiceTests {

    @Mock ShareLinkRepository repository;
    @Mock ProjectService projectService;
    @Mock JwtService jwtService;
    @Mock RateLimitService rateLimitService;
    @Mock HttpServletRequest request;

    private ShareLinkService service;
    private Project project;

    @BeforeEach
    void setUp() {
        service = new ShareLinkService(repository, projectService, jwtService, rateLimitService);
        project = new Project();
        project.setId("project-1");
        project.setTitle("Confluo");
        project.setCreatedAt(Instant.now());
        project.setUpdatedAt(Instant.now());
        project.getMembers().add(new ProjectMember("owner-1", Role.OWNER));
    }

    @Test
    void creationPersistsOnlyAHashAndReturnsRawTokenOnce() {
        when(projectService.requireAccess("owner-1", "project-1"))
                .thenReturn(new ProjectService.Access(project, Role.OWNER));
        when(repository.save(any(ShareLink.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.create("owner-1", "project-1", new CreateShareLinkRequest(null));

        assertNotNull(response.token());
        ArgumentCaptor<ShareLink> captor = ArgumentCaptor.forClass(ShareLink.class);
        verify(repository).save(captor.capture());
        assertNotEquals(response.token(), captor.getValue().getTokenHash());
        assertEquals(32, java.util.Base64.getUrlDecoder().decode(captor.getValue().getTokenHash()).length);
    }

    @Test
    void exchangeReturnsReadOnlyProjectSessionForActiveLink() {
        ShareLink link = new ShareLink();
        link.setId("link-1");
        link.setProjectId("project-1");
        link.setTokenHash(hash("raw-token"));
        link.setCreatedAt(Instant.now());
        when(request.getRemoteAddr()).thenReturn("127.0.0.1");
        when(repository.findByTokenHash(link.getTokenHash())).thenReturn(Optional.of(link));
        when(projectService.requireProject("project-1")).thenReturn(project);
        when(jwtService.generateGuestToken(any(), any())).thenReturn("guest-jwt");

        GuestSessionResponse response = service.exchange("raw-token", request);

        assertEquals("guest-jwt", response.token());
        assertEquals(Role.VIEWER, response.project().role());
    }

    @Test
    void expiredLinkIsNotExchangeable() {
        ShareLink link = new ShareLink();
        link.setTokenHash(hash("expired"));
        link.setProjectId("project-1");
        link.setCreatedAt(Instant.now().minusSeconds(3600));
        link.setExpiresAt(Instant.now().minusSeconds(1));
        when(request.getRemoteAddr()).thenReturn("127.0.0.1");
        when(repository.findByTokenHash(link.getTokenHash())).thenReturn(Optional.of(link));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class, () -> service.exchange("expired", request));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
    }

    private static String hash(String value) {
        try {
            return java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(
                    java.security.MessageDigest.getInstance("SHA-256")
                            .digest(value.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new AssertionError(e);
        }
    }
}
