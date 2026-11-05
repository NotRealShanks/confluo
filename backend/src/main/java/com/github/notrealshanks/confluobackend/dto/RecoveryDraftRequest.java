package com.github.notrealshanks.confluobackend.dto;

import jakarta.validation.constraints.NotBlank;

public record RecoveryDraftRequest(
        @NotBlank(message = "File ID is required")
        String fileId,

        String content) {
}

