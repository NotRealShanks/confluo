package com.github.notrealshanks.confluobackend.dto;

import java.util.List;

public record ProjectActivityPageResponse(
        List<ProjectActivityResponse> activities,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean hasMore
) {
}

