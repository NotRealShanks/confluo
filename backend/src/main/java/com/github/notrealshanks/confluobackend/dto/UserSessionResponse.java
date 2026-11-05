package com.github.notrealshanks.confluobackend.dto;

import java.time.Instant;
import com.github.notrealshanks.confluobackend.model.SessionStatus;

public record UserSessionResponse(
    String id,
    String deviceInfo,
    String ipAddress,
    String userAgent,
    Instant createdAt,
    Instant lastUsedAt,
    Instant expiresAt,
    SessionStatus status,
    boolean current
) {}

