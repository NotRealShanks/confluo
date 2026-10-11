package com.github.notrealshanks.confluobackend.dto;

import com.github.notrealshanks.confluobackend.model.Role;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AddMemberRequest(
        @NotBlank @Email @Size(max = 254) String email,
        @NotNull Role role
) {
}