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

    private static MockHttpServletRequest requestWithBearer(String token) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + token);
        return request;
    }
}
