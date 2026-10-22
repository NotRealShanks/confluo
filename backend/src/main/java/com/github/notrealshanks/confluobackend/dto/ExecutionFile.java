package com.github.notrealshanks.confluobackend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ExecutionFile(
        @NotBlank @Size(max = 512) String path,
        @Size(max = 1_000_000) String content) {
}
