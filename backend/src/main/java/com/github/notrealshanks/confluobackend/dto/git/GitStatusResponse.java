package com.github.notrealshanks.confluobackend.dto.git;

import java.util.List;

public record GitStatusResponse(
        boolean initialized,
        String currentBranch,
        List<GitFileStatus> staged,
        List<GitFileStatus> unstaged,
        List<String> untracked) {
}

