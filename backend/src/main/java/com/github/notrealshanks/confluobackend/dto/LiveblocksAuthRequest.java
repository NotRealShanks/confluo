package com.github.notrealshanks.confluobackend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// The Liveblocks room id is the project id
public record LiveblocksAuthRequest(@NotBlank @Size(max = 128) String room) {
}