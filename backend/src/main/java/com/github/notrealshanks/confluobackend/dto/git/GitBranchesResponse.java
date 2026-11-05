package com.github.notrealshanks.confluobackend.dto.git;

import java.util.List;

public record GitBranchesResponse(
        String currentBranch,
        List<String> branches) {
}

