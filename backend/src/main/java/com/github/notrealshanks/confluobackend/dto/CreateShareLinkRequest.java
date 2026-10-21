package com.github.notrealshanks.confluobackend.dto;

import java.time.Instant;

import jakarta.validation.constraints.Future;

public record CreateShareLinkRequest(@Future(message = "Expiration must be in the future") Instant expiresAt) {
}
