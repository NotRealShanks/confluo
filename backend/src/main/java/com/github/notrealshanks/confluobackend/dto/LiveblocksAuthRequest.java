package com.github.notrealshanks.confluobackend.dto;

import jakarta.validation.constraints.Size;

// The Liveblocks room id is the project id; optional for user-level session (inbox notifications)
public record LiveblocksAuthRequest(@Size(max = 128) String room) {
}
