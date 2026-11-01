package com.github.notrealshanks.confluobackend.dto;

import java.time.Instant;
import java.util.Map;

import com.github.notrealshanks.confluobackend.model.ProjectActivityType;

public record ProjectActivityResponse(
        String id,
        String projectId,
        String actorId,
        String actorName,
        ProjectActivityType actionType,
        String targetUserId,
        String targetUserName,
        Map<String, Object> metadata,
        Instant timestamp
) {
}

