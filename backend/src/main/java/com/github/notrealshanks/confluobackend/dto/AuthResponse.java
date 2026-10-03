package com.github.notrealshanks.confluobackend.dto;

public record AuthResponse(String token, UserResponse user) {
}
