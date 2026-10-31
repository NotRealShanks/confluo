package com.github.notrealshanks.confluobackend.dto;

import java.time.Instant;

import com.github.notrealshanks.confluobackend.model.ChatMessage;

public record ChatMessageResponse(
        String id,
        String projectId,
        String senderUserId,
        String senderName,
        String senderAvatarUrl,
        String message,
        Instant createdAt
) {
    public static ChatMessageResponse from(ChatMessage msg) {
        return new ChatMessageResponse(
                msg.getId(),
                msg.getProjectId(),
                msg.getSenderUserId(),
                msg.getSenderName(),
                msg.getSenderAvatarUrl(),
                msg.getMessage(),
                msg.getCreatedAt()
        );
    }
}

