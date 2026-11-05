package com.github.notrealshanks.confluobackend.dto.git;

public record GitSyncRemoteRequest(
    String remoteUrl,
    String branch,
    String username,
    String token
) {}

