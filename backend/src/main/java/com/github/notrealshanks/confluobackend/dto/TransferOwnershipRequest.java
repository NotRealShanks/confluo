package com.github.notrealshanks.confluobackend.dto;

import jakarta.validation.constraints.NotBlank;

public record TransferOwnershipRequest(
        @NotBlank(message = "newOwnerId is required") String newOwnerId) {
}

