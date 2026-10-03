package com.github.notrealshanks.confluobackend.dto;

import com.github.notrealshanks.confluobackend.model.User;

public record UserResponse(
        String id,
        String email,
        String name,
        String avatarUrl,
        String provider
) {
    // Deliberately omits passwordHash
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getAvatarUrl(),
                user.getProvider());
    }
}