package com.github.notrealshanks.confluobackend.dto.git;

import java.util.Map;

public record GitSyncRequest(Map<String, String> files) {
}

