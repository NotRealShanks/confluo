package com.github.notrealshanks.confluobackend.dto.git;

import jakarta.validation.constraints.NotBlank;

public record GitBranchRequest(
        @NotBlank(message = "Branch name is required")
        String branchName) {
}

