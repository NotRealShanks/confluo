package com.github.notrealshanks.confluobackend.security;

import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import com.github.notrealshanks.confluobackend.model.ShareLink;
import com.github.notrealshanks.confluobackend.repository.ShareLinkRepository;

import jakarta.servlet.FilterChain;

@ExtendWith(MockitoExtension.class)
class JwtAuthFilterTests {

    @Mock JwtService jwtService;
    @Mock ShareLinkRepository shareLinkRepository;
    @Mock FilterChain chain;

    @Test
    void revokedLinkCannotUsePreviouslyIssuedGuestToken() throws Exception {
        ShareLink revoked = new ShareLink();
        revoked.setId("link-1");
        revoked.setRevokedAt(Instant.now());
        when(jwtService.parseToken("guest-jwt"))
                .thenReturn(new JwtService.TokenClaims("guest-1", true, "project-1", "link-1"));
        when(shareLinkRepository.findById("link-1")).thenReturn(Optional.of(revoked));

        SecurityContextHolder.clearContext();
        new JwtAuthFilter(jwtService, shareLinkRepository).doFilter(
                requestWithBearer("guest-jwt"), new MockHttpServletResponse(), chain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(chain).doFilter(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any());
    }

    @Test
    void activeLinkCreatesProjectScopedGuestPrincipal() throws Exception {
        ShareLink active = new ShareLink();
        active.setId("link-1");
        active.setProjectId("project-1");
        active.setExpiresAt(Instant.now().plusSeconds(60));
        when(jwtService.parseToken("guest-jwt"))
                .thenReturn(new JwtService.TokenClaims("guest-1", true, "project-1", "link-1"));
        when(shareLinkRepository.findById("link-1")).thenReturn(Optional.of(active));

        SecurityContextHolder.clearContext();
        new JwtAuthFilter(jwtService, shareLinkRepository).doFilter(
                requestWithBearer("guest-jwt"), new MockHttpServletResponse(), chain);

        assertSame(GuestPrincipal.class,
                SecurityContextHolder.getContext().getAuthentication().getPrincipal().getClass());
        GuestPrincipal principal = (GuestPrincipal) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        org.junit.jupiter.api.Assertions.assertEquals("project-1", principal.projectId());
        org.junit.jupiter.api.Assertions.assertEquals("link-1", principal.shareLinkId());
    }

    @Test
    void mismatchedLinkProjectCannotAuthenticateGuest() throws Exception {
        ShareLink link = new ShareLink();
        link.setId("link-1");
        link.setProjectId("project-2");
        when(jwtService.parseToken("guest-jwt"))
                .thenReturn(new JwtService.TokenClaims("guest-1", true, "project-1", "link-1"));
        when(shareLinkRepository.findById("link-1")).thenReturn(Optional.of(link));

        SecurityContextHolder.clearContext();
        new JwtAuthFilter(jwtService, shareLinkRepository).doFilter(
                requestWithBearer("guest-jwt"), new MockHttpServletResponse(), chain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void expiredLinkCannotAuthenticateGuest() throws Exception {
        ShareLink link = new ShareLink();
        link.setId("link-1");
        link.setProjectId("project-1");
        link.setExpiresAt(Instant.now().minusSeconds(1));
        when(jwtService.parseToken("guest-jwt"))
                .thenReturn(new JwtService.TokenClaims("guest-1", true, "project-1", "link-1"));
        when(shareLinkRepository.findById("link-1")).thenReturn(Optional.of(link));

        SecurityContextHolder.clearContext();
        new JwtAuthFilter(jwtService, shareLinkRepository).doFilter(
                requestWithBearer("guest-jwt"), new MockHttpServletResponse(), chain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void deletedLinkCannotAuthenticateGuest() throws Exception {
        when(jwtService.parseToken("guest-jwt"))
                .thenReturn(new JwtService.TokenClaims("guest-1", true, "project-1", "missing-link"));
        when(shareLinkRepository.findById("missing-link")).thenReturn(Optional.empty());

        SecurityContextHolder.clearContext();
        new JwtAuthFilter(jwtService, shareLinkRepository).doFilter(
                requestWithBearer("guest-jwt"), new MockHttpServletResponse(), chain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void malformedGuestClaimsCannotAuthenticate() throws Exception {
        when(jwtService.parseToken("guest-jwt"))
                .thenReturn(new JwtService.TokenClaims("guest-1", true, "project-1", null));

        SecurityContextHolder.clearContext();
        new JwtAuthFilter(jwtService, shareLinkRepository).doFilter(
                requestWithBearer("guest-jwt"), new MockHttpServletResponse(), chain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void registeredUserAuthenticationDoesNotQueryShareLinks() throws Exception {
        when(jwtService.parseToken("user-jwt"))
                .thenReturn(new JwtService.TokenClaims("user-1", false, null, null));

        SecurityContextHolder.clearContext();
        new JwtAuthFilter(jwtService, shareLinkRepository).doFilter(
                requestWithBearer("user-jwt"), new MockHttpServletResponse(), chain);

        org.junit.jupiter.api.Assertions.assertEquals(
                "user-1", SecurityContextHolder.getContext().getAuthentication().getName());
        org.mockito.Mockito.verifyNoInteractions(shareLinkRepository);
    }

    private static MockHttpServletRequest requestWithBearer(String token) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + token);
        return request;
    }
}
