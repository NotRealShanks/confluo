package com.github.notrealshanks.confluobackend.dto;

public record ExecutionResponse(
        String stdout,
        String stderr,
        Integer exitCode,
        boolean timedOut) {
}
