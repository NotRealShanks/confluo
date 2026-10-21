package com.github.notrealshanks.confluobackend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record GuestExchangeRequest(@NotBlank @Size(max = 256) String token) {
}
