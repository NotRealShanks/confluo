package com.github.notrealshanks.confluobackend.dto;

import jakarta.validation.constraints.NotBlank;

public record ConfirmLoginRequest(
        @NotBlank(message = "Confirmation token is required")
        String confirmationToken) {
}

