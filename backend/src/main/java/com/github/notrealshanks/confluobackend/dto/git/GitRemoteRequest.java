package com.github.notrealshanks.confluobackend.dto.git;

import jakarta.validation.constraints.NotBlank;

public record GitRemoteRequest(
    @NotBlank String remoteUrl
) {}

