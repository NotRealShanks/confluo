package com.github.notrealshanks.confluobackend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateProjectRequest(@NotBlank @Size(max = 200) String title) {
}
