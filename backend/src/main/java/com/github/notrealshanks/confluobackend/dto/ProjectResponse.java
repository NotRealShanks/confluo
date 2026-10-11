package com.github.notrealshanks.confluobackend.dto;

import java.time.Instant;

import com.github.notrealshanks.confluobackend.model.Role;

// role is the caller's own role on this project
public record ProjectResponse(String id, String title, Role role, Instant createdAt, Instant updatedAt) {
}
