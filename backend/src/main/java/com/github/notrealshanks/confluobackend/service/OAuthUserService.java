package com.github.notrealshanks.confluobackend.service;

import java.util.Locale;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import com.github.notrealshanks.confluobackend.exception.OAuthLoginException;
import com.github.notrealshanks.confluobackend.model.User;
import com.github.notrealshanks.confluobackend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OAuthUserService {

    public record Profile(
            String provider,
            String providerId,
            String email,
            boolean emailVerified,
            String name,
            String avatarUrl) {
    }

    private final UserRepository userRepository;

    public User findOrCreate(Profile profile) {
        if (profile.providerId() == null || profile.providerId().isBlank()) {
            throw new OAuthLoginException("invalid_profile");
        }
        return userRepository.findByProviderAndProviderId(profile.provider(), profile.providerId())
                .orElseGet(() -> createUser(profile));
    }

    private User createUser(Profile profile) {
        if (profile.email() == null || !profile.emailVerified()) {
            throw new OAuthLoginException("email_unverified");
        }
        String email = profile.email().trim().toLowerCase(Locale.ROOT);

        // Never auto-link: an existing account with this email could be an unverified local signup
        if (userRepository.findByEmail(email).isPresent()) {
            throw new OAuthLoginException("email_conflict");
        }

        User user = new User();
        user.setEmail(email);
        user.setName(profile.name() == null || profile.name().isBlank() ? email : profile.name());
        user.setAvatarUrl(profile.avatarUrl());
        user.setProvider(profile.provider());
        user.setProviderId(profile.providerId());

        try {
            return userRepository.save(user);
        } catch (DuplicateKeyException e) {
            throw new OAuthLoginException("email_conflict");
        }
    }
}