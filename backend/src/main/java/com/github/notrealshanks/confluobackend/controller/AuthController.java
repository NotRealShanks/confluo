package com.github.notrealshanks.confluobackend.controller;

import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.github.notrealshanks.confluobackend.dto.AuthResponse;
import com.github.notrealshanks.confluobackend.dto.ConfirmLoginRequest;
import com.github.notrealshanks.confluobackend.dto.LoginRequest;
import com.github.notrealshanks.confluobackend.dto.SignupRequest;
import com.github.notrealshanks.confluobackend.dto.UserSessionResponse;
import com.github.notrealshanks.confluobackend.model.User;
import com.github.notrealshanks.confluobackend.security.JwtService;
import com.github.notrealshanks.confluobackend.service.AuthService;
import com.github.notrealshanks.confluobackend.service.SessionSseManager;
import com.github.notrealshanks.confluobackend.service.UserSessionService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserSessionService userSessionService;
    private final SessionSseManager sessionSseManager;
    private final JwtService jwtService;

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(
            @Valid @RequestBody SignupRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(authService.signup(request, httpRequest, httpResponse));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        return authService.login(request, httpRequest, httpResponse);
    }

    @PostMapping("/login/confirm")
    public ResponseEntity<AuthResponse> confirmLogin(
            @Valid @RequestBody ConfirmLoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        return ResponseEntity.ok(userSessionService.confirmOverride(request.confirmationToken(), httpRequest, httpResponse));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
            @CookieValue(name = UserSessionService.REFRESH_COOKIE, required = false) String refreshTokenCookie,
            @CookieValue(name = UserSessionService.CSRF_COOKIE, required = false) String csrfCookie,
            @RequestHeader(name = UserSessionService.CSRF_HEADER, required = false) String csrfHeader,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        return ResponseEntity.ok(userSessionService.rotateSession(
                refreshTokenCookie, csrfCookie, csrfHeader, httpRequest, httpResponse));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @CookieValue(name = UserSessionService.REFRESH_COOKIE, required = false) String refreshTokenCookie,
            @CookieValue(name = UserSessionService.CSRF_COOKIE, required = false) String csrfCookie,
            @RequestHeader(name = UserSessionService.CSRF_HEADER, required = false) String csrfHeader,
            HttpServletResponse httpResponse) {
        userSessionService.logout(refreshTokenCookie, csrfCookie, csrfHeader, httpResponse);
        return ResponseEntity.noContent().build();
    }

    @GetMapping(value = "/events/session", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamSessionEvents(
            @RequestParam(value = "token", required = false) String tokenParam,
            HttpServletRequest request) {
        String token = tokenParam;
        if (token == null || token.isBlank()) {
            String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7);
            }
        }
        String userId = jwtService.extractUserId(token);
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        return sessionSseManager.register(userId);
    }

    @GetMapping("/sessions")
    public List<UserSessionResponse> getSessions(
            Authentication authentication,
            @CookieValue(name = UserSessionService.REFRESH_COOKIE, required = false) String rawRefreshToken) {
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        return userSessionService.listUserSessions(authentication.getName(), rawRefreshToken);
    }

    @DeleteMapping("/sessions/{sessionId}")
    public ResponseEntity<Void> revokeSession(
            Authentication authentication,
            @PathVariable String sessionId) {
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        userSessionService.revokeSession(authentication.getName(), sessionId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/sessions/other")
    public ResponseEntity<Void> revokeOtherSessions(
            Authentication authentication,
            @CookieValue(name = UserSessionService.REFRESH_COOKIE, required = false) String rawRefreshToken) {
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        userSessionService.revokeOtherSessions(authentication.getName(), rawRefreshToken);
        return ResponseEntity.noContent().build();
    }
}
