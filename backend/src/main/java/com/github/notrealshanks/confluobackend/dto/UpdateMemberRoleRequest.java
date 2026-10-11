package com.github.notrealshanks.confluobackend.dto;

import com.github.notrealshanks.confluobackend.model.Role;

import jakarta.validation.constraints.NotNull;

public record UpdateMemberRoleRequest(@NotNull Role role) {
}