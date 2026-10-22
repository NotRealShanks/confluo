package com.github.notrealshanks.confluobackend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Only fields deliberately editable by an authenticated account holder belong here. */
public record ProfileUpdateRequest(@NotBlank @Size(max = 100) String name) {
}
