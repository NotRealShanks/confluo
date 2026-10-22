package com.github.notrealshanks.confluobackend.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

public record ExecutionRequest(
        @NotBlank @Size(max = 32) String language,
        @NotBlank @Size(max = 512) String entrypoint,
        @NotEmpty @Size(max = 500) List<@Valid ExecutionFile> files) {
}
