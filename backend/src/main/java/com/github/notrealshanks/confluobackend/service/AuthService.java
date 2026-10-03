package com.github.notrealshanks.confluobackend.service;

import java.util.Locale;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.github.notrealshanks.confluobackend.dto.AuthResponse;
import com.github.notrealshanks.confluobackend.dto.LoginRequest;
import com.github.notrealshanks.confluobackend.dto.SignupRequest;
import com.github.notrealshanks.confluobackend.dto.UserResponse;
import com.github.notrealshanks.confluobackend.model.User;
import com.github.notrealshanks.confluobackend.repository.UserRepository;
import com.github.notrealshanks.confluobackend.security.JwtService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final String LOCAL_PROVIDER = "local";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthResponse signup(SignupRequest request) {
        String email = normalizeEmail(request.email());

        if (userRepository.findByEmail(email).isPresent()) {
            throw emailTaken();
        }

        User user = new User();
        user.setEmail(email);
        user.setName(request.name().trim());
        user.setProvider(LOCAL_PROVIDER);
        user.setPasswordHash(passwordEncoder.encode(request.password()));

        User saved;
        try {
            saved = userRepository.save(user);
        } catch (DuplicateKeyException e) {
            // Lost a race with a concurrent signup; the unique index caught it
            throw emailTaken();
        }
        return buildAuthResponse(saved);
    }

    public AuthResponse login(LoginRequest request) {
        // One generic error for unknown email, OAuth-only account, or wrong password
        User user = userRepository.findByEmail(normalizeEmail(request.email()))
                .filter(u -> LOCAL_PROVIDER.equals(u.getProvider()) && u.getPasswordHash() != null)
                .filter(u -> passwordEncoder.matches(request.password(), u.getPasswordHash()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        return buildAuthResponse(user);
    }

    // Shared by local login and the future OAuth success handler
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