package com.github.notrealshanks.confluobackend.dto;

import java.time.Instant;

public record ShareLinkResponse(
        String id,
        String projectId,
        Instant createdAt,
        Instant expiresAt,
        Instant revokedAt,
        String status,
        String token) {
}
