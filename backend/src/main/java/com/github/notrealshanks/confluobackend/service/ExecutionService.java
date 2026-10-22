package com.github.notrealshanks.confluobackend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import com.github.notrealshanks.confluobackend.dto.ExecutionRequest;
import com.github.notrealshanks.confluobackend.dto.ExecutionResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ExecutionService {
    private final ProjectService projectService;

    @Value("${app.execution-service-url:}")
    private String executionServiceUrl;

    public ExecutionResponse execute(String userId, String projectId, ExecutionRequest request) {
        ProjectService.Access access = projectService.requireAccess(userId, projectId);
        if (!access.role().canEdit()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only project editors can run code");
        }
        if (executionServiceUrl == null || executionServiceUrl.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Code execution is not configured. Configure APP_EXECUTION_SERVICE_URL.");
        }
        validateEntrypoint(request);
        request.files().forEach(file -> {
            if (file.path().contains("..") || file.path().startsWith("/")
                    || file.path().contains("\\") || file.path().contains("\0")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid workspace path");
            }
        });
        try {
            return RestClient.create(executionServiceUrl)
                    .post()
                    .uri("/v1/execute")
                    .header("X-Confluo-Project", projectId)
                    .body(request)
                    .retrieve()
                    .body(ExecutionResponse.class);
        } catch (RuntimeException error) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Execution service is unavailable", error);
        }
    }

    private static void validateEntrypoint(ExecutionRequest request) {
        if (request.entrypoint().contains("..") || request.entrypoint().startsWith("/")
                || request.entrypoint().contains("\\")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid entrypoint");
        }
    }
}
