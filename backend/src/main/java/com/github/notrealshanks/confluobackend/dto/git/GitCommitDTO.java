package com.github.notrealshanks.confluobackend.dto.git;

public record GitCommitDTO(
        String hash,
        String authorName,
        String authorEmail,
        String timestamp,
        String message) {
}

