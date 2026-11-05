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
    private final String cookieSecureConfig;
    private final String cookieSameSiteConfig;
    private final String frontendUrl;

    public UserSessionService(
            UserSessionRepository userSessionRepository,
            UserRepository userRepository,
            JwtService jwtService,
            SessionSseManager sessionSseManager,
            @Value("${jwt.refresh-token-expiration-ms:1296000000}") long refreshTokenExpirationMs,
            @Value("${app.cookie.secure:auto}") String cookieSecureConfig,
            @Value("${app.cookie.same-site:auto}") String cookieSameSiteConfig,
            @Value("${app.frontend-url:http://localhost:5173}") String frontendUrl) {
        this.userSessionRepository = userSessionRepository;
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.sessionSseManager = sessionSseManager;
        this.refreshTokenExpirationMs = refreshTokenExpirationMs;
        this.cookieSecureConfig = cookieSecureConfig;
        this.cookieSameSiteConfig = cookieSameSiteConfig;
        this.frontendUrl = frontendUrl == null ? "http://localhost:5173" : frontendUrl.trim().replaceAll("^\"|\"$", "").replaceAll("/+$", "");
    }

    public UserSessionService(
            UserSessionRepository userSessionRepository,
            UserRepository userRepository,
            JwtService jwtService,
            SessionSseManager sessionSseManager,
            long refreshTokenExpirationMs,
            boolean cookieSecure,
            String cookieSameSite) {
        this(userSessionRepository, userRepository, jwtService, sessionSseManager,
                refreshTokenExpirationMs, String.valueOf(cookieSecure), cookieSameSite, "http://localhost:5173");
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
        String userAgent = request != null ? request.getHeader(HttpHeaders.USER_AGENT) : null;
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

        setCookies(response, request, selector + "." + verifier, csrfToken, refreshTokenExpirationMs / 1000);

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

        validateCsrf(csrfCookie, csrfHeader, request);

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
                    clearCookies(response, request);
                    return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unknown refresh token");
                });

        if (stored.getStatus() != SessionStatus.ACTIVE) {
            // Reuse of an already rotated or revoked session indicates token compromise.
            revokeAllForUser(stored.getUserId());
            sessionSseManager.notifySessionTerminated(
                    stored.getUserId(),
                    "Security alert: Refresh token reuse detected. All sessions have been terminated.");
            clearCookies(response, request);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token reuse detected — all sessions revoked");
        }

        if (stored.getExpiresAt().isBefore(Instant.now())) {
            stored.setStatus(SessionStatus.REVOKED);
            stored.setRevokedAt(Instant.now());
            userSessionRepository.save(stored);
            clearCookies(response, request);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Session expired");
        }

        if (!hasher.matches(verifier, stored.getVerifierHash())) {
            clearCookies(response, request);
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

        String userAgent = request != null ? request.getHeader(HttpHeaders.USER_AGENT) : null;
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
        setCookies(response, request, newSelector + "." + newVerifier, newCsrfToken, remainingSeconds);

        String newAccessToken = jwtService.generateToken(user);
        return new AuthResponse(newAccessToken, UserResponse.from(user));
    }

    public void logout(String rawRefreshToken, String csrfCookie, String csrfHeader, HttpServletRequest request, HttpServletResponse response) {
        if (rawRefreshToken != null && !rawRefreshToken.isBlank()) {
            String[] parts = rawRefreshToken.split("\\.", 2);
            if (parts.length == 2) {
                userSessionRepository.findBySelector(parts[0]).ifPresent(s -> {
                    s.setStatus(SessionStatus.REVOKED);
                    s.setRevokedAt(Instant.now());
                    userSessionRepository.save(s);
                });
            }
        }
        clearCookies(response, request);
    }

    public void logout(String rawRefreshToken, String csrfCookie, String csrfHeader, HttpServletResponse response) {
        logout(rawRefreshToken, csrfCookie, csrfHeader, null, response);
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
                        s.getDeviceInfo(),
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

        session.setStatus(SessionStatus.REVOKED);
        session.setRevokedAt(Instant.now());
        userSessionRepository.save(session);
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

    public boolean isCookieSecure(HttpServletRequest request) {
        if ("true".equalsIgnoreCase(cookieSecureConfig)) {
            return true;
        }
        if ("false".equalsIgnoreCase(cookieSecureConfig)) {
            return false;
        }
        // auto: check frontendUrl or incoming request
        if (frontendUrl != null && frontendUrl.toLowerCase().startsWith("https://")) {
            return true;
        }
        if (request != null) {
            if (request.isSecure()) return true;
            String proto = request.getHeader("X-Forwarded-Proto");
            if (proto != null && proto.toLowerCase().contains("https")) return true;
        }
        return false;
    }

    public String getCookieSameSite(HttpServletRequest request) {
        if (cookieSameSiteConfig != null && !cookieSameSiteConfig.isBlank() && !"auto".equalsIgnoreCase(cookieSameSiteConfig)) {
            return cookieSameSiteConfig;
        }
        // If secure, use None to allow cross-origin credentials; otherwise Lax for local dev
        return isCookieSecure(request) ? "None" : "Lax";
    }

    public void validateCsrf(String csrfCookie, String csrfHeader, HttpServletRequest request) {
        if (csrfCookie != null && csrfHeader != null && csrfCookie.equals(csrfHeader)) {
            return;
        }

        if (request != null) {
            String origin = request.getHeader("Origin");
            if (origin != null && !origin.isBlank()) {
                if (isAllowedOrigin(origin)) {
                    return;
                }
                log.warn("CSRF rejected: Origin {} does not match allowed frontend {}", origin, frontendUrl);
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Invalid origin for CSRF verification");
            }

            String referer = request.getHeader("Referer");
            if (referer != null && !referer.isBlank()) {
                if (isAllowedReferer(referer)) {
                    return;
                }
                log.warn("CSRF rejected: Referer {} does not match allowed frontend {}", referer, frontendUrl);
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Invalid referer for CSRF verification");
            }

            if (isLocalOrTestRequest(request)) {
                return;
            }
        }

        if (csrfCookie != null && csrfHeader != null && csrfCookie.equals(csrfHeader)) {
            return;
        }

        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "CSRF token missing or invalid");
    }

    public void validateCsrf(String csrfCookie, String csrfHeader) {
        validateCsrf(csrfCookie, csrfHeader, null);
    }

    private boolean isAllowedOrigin(String origin) {
        if (origin == null || origin.isBlank()) return false;
        String normalizedOrigin = origin.trim().replaceAll("/+$", "").toLowerCase();
        for (String allowed : frontendUrl.split("\\s*,\\s*")) {
            String normalizedAllowed = allowed.trim().replaceAll("/+$", "").toLowerCase();
            if (normalizedAllowed.equals("*") || normalizedAllowed.equals(normalizedOrigin)) {
                return true;
            }
        }
        return normalizedOrigin.startsWith("http://localhost:") || normalizedOrigin.startsWith("http://127.0.0.1:");
    }

    private boolean isAllowedReferer(String referer) {
        if (referer == null || referer.isBlank()) return false;
        try {
            java.net.URI uri = java.net.URI.create(referer);
            String origin = uri.getScheme() + "://" + uri.getAuthority();
            return isAllowedOrigin(origin);
        } catch (Exception e) {
            return false;
        }
    }

    private boolean isLocalOrTestRequest(HttpServletRequest request) {
        String remoteAddr = request.getRemoteAddr();
        return remoteAddr == null || "127.0.0.1".equals(remoteAddr) || "0:0:0:0:0:0:0:1".equals(remoteAddr) || "localhost".equalsIgnoreCase(request.getServerName());
    }

    public void setCookies(HttpServletResponse response, HttpServletRequest request, String rawRefreshToken, String csrfToken, long maxAgeSeconds) {
        boolean secure = isCookieSecure(request);
        String sameSite = getCookieSameSite(request);

        ResponseCookie refreshCookie = ResponseCookie.from(REFRESH_COOKIE, rawRefreshToken)
                .httpOnly(true)
                .secure(secure)
                .sameSite(sameSite)
                .path("/")
                .maxAge(maxAgeSeconds)
                .build();

        ResponseCookie csrfCookie = ResponseCookie.from(CSRF_COOKIE, csrfToken)
                .httpOnly(false)
                .secure(secure)
                .sameSite(sameSite)
                .path("/")
                .maxAge(maxAgeSeconds)
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, csrfCookie.toString());
        response.setHeader(CSRF_HEADER, csrfToken);
        response.setHeader("X-CSRF-TOKEN", csrfToken);
    }

    public void setCookies(HttpServletResponse response, String rawRefreshToken, String csrfToken, long maxAgeSeconds) {
        setCookies(response, null, rawRefreshToken, csrfToken, maxAgeSeconds);
    }

    public void clearCookies(HttpServletResponse response, HttpServletRequest request) {
        boolean secure = isCookieSecure(request);
        String sameSite = getCookieSameSite(request);

        ResponseCookie refreshCookie = ResponseCookie.from(REFRESH_COOKIE, "")
                .httpOnly(true)
                .secure(secure)
                .sameSite(sameSite)
                .path("/")
                .maxAge(0)
                .build();

        ResponseCookie csrfCookie = ResponseCookie.from(CSRF_COOKIE, "")
                .httpOnly(false)
                .secure(secure)
                .sameSite(sameSite)
                .path("/")
                .maxAge(0)
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, csrfCookie.toString());
    }

    public void clearCookies(HttpServletResponse response) {
        clearCookies(response, null);
    }

    private String randomUrlSafeString(int byteLength) {
        byte[] bytes = new byte[byteLength];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public static String extractClientIp(HttpServletRequest request) {
        if (request == null) return "Unknown";
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isBlank()) {
            return request.getRemoteAddr() != null ? request.getRemoteAddr() : "Unknown";
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
