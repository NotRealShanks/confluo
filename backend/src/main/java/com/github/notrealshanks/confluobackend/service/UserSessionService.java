package com.github.notrealshanks.confluobackend.service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.github.notrealshanks.confluobackend.dto.AuthResponse;
import com.github.notrealshanks.confluobackend.dto.UserResponse;
import com.github.notrealshanks.confluobackend.dto.UserSessionResponse;
import com.github.notrealshanks.confluobackend.model.SessionStatus;
import com.github.notrealshanks.confluobackend.model.User;
import com.github.notrealshanks.confluobackend.model.UserSession;
import com.github.notrealshanks.confluobackend.repository.UserRepository;
import com.github.notrealshanks.confluobackend.repository.UserSessionRepository;
import com.github.notrealshanks.confluobackend.security.JwtService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class UserSessionService {

    public static final String REFRESH_COOKIE = "refreshToken";
    public static final String CSRF_COOKIE = "XSRF-TOKEN";
    public static final String CSRF_HEADER = "X-XSRF-TOKEN";

    private final UserSessionRepository userSessionRepository;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final SessionSseManager sessionSseManager;
    private final SecureRandom secureRandom = new SecureRandom();
    private final BCryptPasswordEncoder hasher = new BCryptPasswordEncoder(12);

    private final long refreshTokenExpirationMs;
    private final boolean cookieSecure;
    private final String cookieSameSite;

    public UserSessionService(
            UserSessionRepository userSessionRepository,
            UserRepository userRepository,
            JwtService jwtService,
            SessionSseManager sessionSseManager,
            @Value("${jwt.refresh-token-expiration-ms:1296000000}") long refreshTokenExpirationMs,
            @Value("${app.cookie.secure:false}") boolean cookieSecure,
            @Value("${app.cookie.same-site:Lax}") String cookieSameSite) {
        this.userSessionRepository = userSessionRepository;
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.sessionSseManager = sessionSseManager;
        this.refreshTokenExpirationMs = refreshTokenExpirationMs;
        this.cookieSecure = cookieSecure;
        this.cookieSameSite = cookieSameSite;
    }

    public Optional<UserSession> checkActiveSessionConflict(String userId) {
        return userSessionRepository.findFirstByUserIdAndStatusOrderByCreatedAtDesc(userId, SessionStatus.ACTIVE)
                .filter(session -> session.getExpiresAt().isAfter(Instant.now()));
    }

    public AuthResponse issueSession(User user, HttpServletRequest request, HttpServletResponse response) {
        String selector = randomUrlSafeString(16);
        String verifier = randomUrlSafeString(48);
        String csrfToken = randomUrlSafeString(32);

        Instant now = Instant.now();
        Instant expiresAt = now.plusMillis(refreshTokenExpirationMs);
        String userAgent = request.getHeader(HttpHeaders.USER_AGENT);
        String ipAddress = extractClientIp(request);
        String deviceInfo = parseDeviceInfo(userAgent);

        UserSession session = UserSession.builder()
                .userId(user.getId())
                .selector(selector)
                .verifierHash(hasher.encode(verifier))
                .createdAt(now)
                .lastUsedAt(now)
                .expiresAt(expiresAt)
                .status(SessionStatus.ACTIVE)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .deviceInfo(deviceInfo)
                .build();

        userSessionRepository.save(session);

        setCookies(response, selector + "." + verifier, csrfToken, refreshTokenExpirationMs / 1000);

        String accessToken = jwtService.generateToken(user);
        return new AuthResponse(accessToken, UserResponse.from(user));
    }

    public AuthResponse confirmOverride(String confirmationToken, HttpServletRequest request, HttpServletResponse response) {
        String userId = jwtService.validateSessionOverrideToken(confirmationToken);
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired confirmation token");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        // Revoke active sessions for this user and notify them via SSE
        List<UserSession> activeSessions = userSessionRepository.findAllByUserIdAndStatus(userId, SessionStatus.ACTIVE);
        Instant now = Instant.now();
        for (UserSession s : activeSessions) {
            s.setStatus(SessionStatus.SUPERSEDED);
            s.setRevokedAt(now);
            userSessionRepository.save(s);
        }

        sessionSseManager.notifySessionTerminated(userId, "Another device signed in to your account");

        return issueSession(user, request, response);
    }

    public AuthResponse rotateSession(
            String rawRefreshToken,
            String csrfCookie,
            String csrfHeader,
            HttpServletRequest request,
            HttpServletResponse response) {

        validateCsrf(csrfCookie, csrfHeader);

        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing refresh token");
        }

        String[] parts = rawRefreshToken.split("\\.", 2);
        if (parts.length != 2) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Malformed refresh token");
        }

        String selector = parts[0];
        String verifier = parts[1];

        UserSession stored = userSessionRepository.findBySelector(selector)
                .orElseThrow(() -> {
                    clearCookies(response);
                    return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unknown refresh token");
                });

        if (stored.getStatus() != SessionStatus.ACTIVE) {
            // Reuse of an already rotated or revoked session indicates token compromise.
            revokeAllForUser(stored.getUserId());
            sessionSseManager.notifySessionTerminated(
                    stored.getUserId(),
                    "Security alert: Refresh token reuse detected. All sessions have been terminated.");
            clearCookies(response);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token reuse detected — all sessions revoked");
        }

        if (stored.getExpiresAt().isBefore(Instant.now())) {
            stored.setStatus(SessionStatus.REVOKED);
            stored.setRevokedAt(Instant.now());
            userSessionRepository.save(stored);
            clearCookies(response);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Session expired");
        }

        if (!hasher.matches(verifier, stored.getVerifierHash())) {
            clearCookies(response);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token");
        }

        User user = userRepository.findById(stored.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User no longer exists"));

        // Mark old session SUPERSEDED
        stored.setStatus(SessionStatus.SUPERSEDED);
        stored.setRevokedAt(Instant.now());
        userSessionRepository.save(stored);

        // Issue new rotated session preserving original createdAt and absolute expiresAt
        String newSelector = randomUrlSafeString(16);
        String newVerifier = randomUrlSafeString(48);
        String newCsrfToken = randomUrlSafeString(32);

        String userAgent = request.getHeader(HttpHeaders.USER_AGENT);
        String ipAddress = extractClientIp(request);
        String deviceInfo = parseDeviceInfo(userAgent);

        UserSession rotated = UserSession.builder()
                .userId(user.getId())
                .selector(newSelector)
                .verifierHash(hasher.encode(newVerifier))
                .createdAt(stored.getCreatedAt())
                .lastUsedAt(Instant.now())
                .expiresAt(stored.getExpiresAt()) // Preserves absolute 15-day limit
                .status(SessionStatus.ACTIVE)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .deviceInfo(deviceInfo)
                .build();

        userSessionRepository.save(rotated);

        long remainingSeconds = Math.max(0, stored.getExpiresAt().getEpochSecond() - Instant.now().getEpochSecond());
        setCookies(response, newSelector + "." + newVerifier, newCsrfToken, remainingSeconds);

        String newAccessToken = jwtService.generateToken(user);
        return new AuthResponse(newAccessToken, UserResponse.from(user));
    }

    public void logout(String rawRefreshToken, String csrfCookie, String csrfHeader, HttpServletResponse response) {
        if (csrfCookie != null && csrfHeader != null && csrfCookie.equals(csrfHeader) && rawRefreshToken != null) {
            String[] parts = rawRefreshToken.split("\\.", 2);
            if (parts.length == 2) {
                userSessionRepository.findBySelector(parts[0]).ifPresent(s -> {
                    s.setStatus(SessionStatus.REVOKED);
                    s.setRevokedAt(Instant.now());
                    userSessionRepository.save(s);
                });
            }
        }
        clearCookies(response);
    }

    public List<UserSessionResponse> listUserSessions(String userId, String rawRefreshToken) {
        String currentSelector = null;
        if (rawRefreshToken != null && rawRefreshToken.contains(".")) {
            currentSelector = rawRefreshToken.split("\\.", 2)[0];
        }

        final String activeSelector = currentSelector;
        return userSessionRepository.findAllByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(s -> new UserSessionResponse(
                        s.getId(),
                        s.getDeviceInfo() != null ? s.getDeviceInfo() : "Web Browser",
                        s.getIpAddress(),
                        s.getUserAgent(),
                        s.getCreatedAt(),
                        s.getLastUsedAt(),
                        s.getExpiresAt(),
                        s.getStatus(),
                        activeSelector != null && activeSelector.equals(s.getSelector())
                ))
                .toList();
    }

    public void revokeSession(String userId, String sessionId) {
        UserSession session = userSessionRepository.findById(sessionId)
                .filter(s -> s.getUserId().equals(userId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));

        if (session.getStatus() == SessionStatus.ACTIVE) {
            session.setStatus(SessionStatus.REVOKED);
            session.setRevokedAt(Instant.now());
            userSessionRepository.save(session);
            sessionSseManager.notifySessionTerminated(userId, "Session was manually terminated from your account settings");
        }
    }

    public void revokeOtherSessions(String userId, String rawRefreshToken) {
        String currentSelector = null;
        if (rawRefreshToken != null && rawRefreshToken.contains(".")) {
            currentSelector = rawRefreshToken.split("\\.", 2)[0];
        }

        List<UserSession> activeSessions = userSessionRepository.findAllByUserIdAndStatus(userId, SessionStatus.ACTIVE);
        Instant now = Instant.now();
        for (UserSession s : activeSessions) {
            if (currentSelector == null || !currentSelector.equals(s.getSelector())) {
                s.setStatus(SessionStatus.REVOKED);
                s.setRevokedAt(now);
                userSessionRepository.save(s);
            }
        }
        sessionSseManager.notifySessionTerminated(userId, "Other active sessions were terminated from account settings");
    }

    public void revokeAllForUser(String userId) {
        List<UserSession> active = userSessionRepository.findAllByUserIdAndStatus(userId, SessionStatus.ACTIVE);
        Instant now = Instant.now();
        for (UserSession s : active) {
            s.setStatus(SessionStatus.REVOKED);
            s.setRevokedAt(now);
            userSessionRepository.save(s);
        }
    }

    public void validateCsrf(String csrfCookie, String csrfHeader) {
        if (csrfCookie == null || csrfHeader == null || !csrfCookie.equals(csrfHeader)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "CSRF token missing or invalid");
        }
    }

    public void setCookies(HttpServletResponse response, String rawRefreshToken, String csrfToken, long maxAgeSeconds) {
        ResponseCookie refreshCookie = ResponseCookie.from(REFRESH_COOKIE, rawRefreshToken)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .path("/api/auth")
                .maxAge(maxAgeSeconds)
                .build();

        ResponseCookie csrfCookie = ResponseCookie.from(CSRF_COOKIE, csrfToken)
                .httpOnly(false)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .path("/")
                .maxAge(maxAgeSeconds)
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, csrfCookie.toString());
    }

    public void clearCookies(HttpServletResponse response) {
        ResponseCookie refreshCookie = ResponseCookie.from(REFRESH_COOKIE, "")
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .path("/api/auth")
                .maxAge(0)
                .build();

        ResponseCookie csrfCookie = ResponseCookie.from(CSRF_COOKIE, "")
                .httpOnly(false)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .path("/")
                .maxAge(0)
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, csrfCookie.toString());
    }

    private String randomUrlSafeString(int byteLength) {
        byte[] bytes = new byte[byteLength];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public static String extractClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isBlank()) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }

    public static String parseDeviceInfo(String userAgent) {
        if (userAgent == null || userAgent.isBlank()) {
            return "Unknown Device";
        }
        if (userAgent.contains("Edg/")) {
            return "Microsoft Edge";
        }
        if (userAgent.contains("Chrome/")) {
            return "Google Chrome";
        }
        if (userAgent.contains("Firefox/")) {
            return "Mozilla Firefox";
        }
        if (userAgent.contains("Safari/") && !userAgent.contains("Chrome")) {
            return "Apple Safari";
        }
        return "Web Browser";
    }
}

