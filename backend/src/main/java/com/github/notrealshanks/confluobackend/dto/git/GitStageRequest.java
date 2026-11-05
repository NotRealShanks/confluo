package com.github.notrealshanks.confluobackend.dto.git;

import java.util.List;

public record GitStageRequest(List<String> paths) {
}

