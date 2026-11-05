package com.github.notrealshanks.confluobackend.dto.git;

import jakarta.validation.constraints.NotBlank;

public record GitCommitRequest(
        @NotBlank(message = "Commit message is required")
        String message) {
}

