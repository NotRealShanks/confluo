package com.github.notrealshanks.confluobackend.service;

import java.time.Duration;
import java.util.Locale;
import java.util.Optional;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.github.notrealshanks.confluobackend.dto.AuthResponse;
import com.github.notrealshanks.confluobackend.dto.LoginConflictResponse;
import com.github.notrealshanks.confluobackend.dto.LoginRequest;
import com.github.notrealshanks.confluobackend.dto.SignupRequest;
import com.github.notrealshanks.confluobackend.dto.UserResponse;
import com.github.notrealshanks.confluobackend.model.User;
import com.github.notrealshanks.confluobackend.model.UserSession;
import com.github.notrealshanks.confluobackend.repository.UserRepository;
import com.github.notrealshanks.confluobackend.security.JwtService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final String LOCAL_PROVIDER = "local";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UserSessionService userSessionService;
    private final RateLimitService rateLimitService;

    public AuthResponse signup(SignupRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        User saved = createNewUser(request);
        return userSessionService.issueSession(saved, httpRequest, httpResponse);
    }

    public AuthResponse signup(SignupRequest request) {
        User saved = createNewUser(request);
        return buildAuthResponse(saved);
    }

    private User createNewUser(SignupRequest request) {
        String email = normalizeEmail(request.email());

        if (userRepository.findByEmail(email).isPresent()) {
            throw emailTaken();
        }

        User user = new User();
        user.setEmail(email);
        user.setName(request.name().trim());
        user.setProvider(LOCAL_PROVIDER);
        user.setPasswordHash(passwordEncoder.encode(request.password()));

        try {
            return userRepository.save(user);
        } catch (DuplicateKeyException e) {
            throw emailTaken();
        }
    }

    public ResponseEntity<?> login(LoginRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        String clientIp = UserSessionService.extractClientIp(httpRequest);
        // Rate limit: 10 attempts per minute per IP
        rateLimitService.check("login:" + clientIp, 10, Duration.ofMinutes(1));

        User user = authenticate(request);

        Optional<UserSession> activeSession = userSessionService.checkActiveSessionConflict(user.getId());
        if (activeSession.isPresent()) {
            UserSession session = activeSession.get();
            String confirmationToken = jwtService.generateSessionOverrideToken(user.getId(), user.getEmail());
            LoginConflictResponse.ActiveSessionInfo info = new LoginConflictResponse.ActiveSessionInfo(
                    session.getDeviceInfo(),
                    session.getIpAddress(),
                    session.getCreatedAt(),
                    session.getLastUsedAt());
            LoginConflictResponse conflictResponse = new LoginConflictResponse(
                    true,
                    confirmationToken,
                    "Another browser session is currently active.",
                    info);
            return ResponseEntity.status(HttpStatus.CONFLICT).body(conflictResponse);
        }

        AuthResponse authResponse = userSessionService.issueSession(user, httpRequest, httpResponse);
        return ResponseEntity.ok(authResponse);
    }

    public AuthResponse login(LoginRequest request) {
        User user = authenticate(request);
        return buildAuthResponse(user);
    }

    private User authenticate(LoginRequest request) {
        return userRepository.findByEmail(normalizeEmail(request.email()))
                .filter(u -> LOCAL_PROVIDER.equals(u.getProvider()) && u.getPasswordHash() != null)
                .filter(u -> passwordEncoder.matches(request.password(), u.getPasswordHash()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
    }

    public AuthResponse buildAuthResponse(User user) {
        return new AuthResponse(jwtService.generateToken(user), UserResponse.from(user));
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private static ResponseStatusException emailTaken() {
        return new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
    }
}
