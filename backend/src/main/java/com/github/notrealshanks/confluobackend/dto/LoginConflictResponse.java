package com.github.notrealshanks.confluobackend.dto;

import java.time.Instant;

public record LoginConflictResponse(
        boolean conflict,
        String confirmationToken,
        String message,
        ActiveSessionInfo activeSession) {

    public record ActiveSessionInfo(
            String deviceInfo,
            String ipAddress,
            Instant createdAt,
            Instant lastUsedAt) {
    }
}

