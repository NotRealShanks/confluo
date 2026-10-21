package com.github.notrealshanks.confluobackend.security;

import java.io.IOException;
import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

// Not a @Component: Boot would also register it as a plain servlet filter outside the security chain
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;

    public JwtAuthFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);

        if (header != null && header.startsWith(BEARER_PREFIX)) {
            JwtService.TokenClaims claims = jwtService.parseToken(header.substring(BEARER_PREFIX.length()));

            if (claims != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                // No authorities yet; roles come with RBAC
                Object principal = claims.guest()
                        ? new GuestPrincipal(claims.subject(), claims.projectId())
                        : claims.subject();
                var authentication = UsernamePasswordAuthenticationToken.authenticated(principal, null, List.of());
                SecurityContext context = SecurityContextHolder.createEmptyContext();
                context.setAuthentication(authentication);
                SecurityContextHolder.setContext(context);
            }
        }

        // A missing or invalid token just leaves the request unauthenticated; the entry point returns 401
        chain.doFilter(request, response);
    }
}