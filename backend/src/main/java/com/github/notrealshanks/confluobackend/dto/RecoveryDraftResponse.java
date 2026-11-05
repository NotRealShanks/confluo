package com.github.notrealshanks.confluobackend.dto;

import java.time.Instant;

import com.github.notrealshanks.confluobackend.model.RecoveryDraft;

public record RecoveryDraftResponse(
        String id,
        String userId,
        String projectId,
        String fileId,
        String content,
        Instant updatedAt) {

    public static RecoveryDraftResponse from(RecoveryDraft draft) {
        return new RecoveryDraftResponse(
                draft.getId(),
                draft.getUserId(),
                draft.getProjectId(),
                draft.getFileId(),
                draft.getContent(),
                draft.getUpdatedAt());
    }
}

