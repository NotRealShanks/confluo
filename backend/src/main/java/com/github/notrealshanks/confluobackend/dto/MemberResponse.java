package com.github.notrealshanks.confluobackend.dto;

import com.github.notrealshanks.confluobackend.model.Role;

public record MemberResponse(String userId, String name, String email, Role role) {
}