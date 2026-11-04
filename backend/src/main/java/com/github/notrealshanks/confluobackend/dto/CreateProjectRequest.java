package com.github.notrealshanks.confluobackend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateProjectRequest(
        @NotBlank @Size(max = 200) String title,
        @Size(max = 50) String templateId,
        @Size(max = 20000) String templateConfig) {

    public CreateProjectRequest(String title) {
        this(title, null, null);
    }

    public CreateProjectRequest(String title, String templateId) {
        this(title, templateId, null);
    }
}