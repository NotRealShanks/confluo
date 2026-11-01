package com.github.notrealshanks.confluobackend.service;

import java.util.regex.Pattern;

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
    private static final Pattern SAFE_PATH_PATTERN = Pattern.compile("^[a-zA-Z0-9_\\-./]+$");

    private final ProjectService projectService;
    private final RateLimitService rateLimitService;

    @Value("${app.execution-service-url:}")
    private String executionServiceUrl;

    @Value("${app.execution-service-token:}")
    private String executionServiceToken;

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
        if (executionServiceToken == null || executionServiceToken.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Code execution authentication is not configured. Configure APP_EXECUTION_SERVICE_TOKEN.");
        }

        // Enforce rate limiting to prevent resource exhaustion / abuse
        rateLimitService.check("exec:" + userId);

        validateEntrypoint(request);
        request.files().forEach(file -> {
            if (file.path().contains("..") || file.path().startsWith("/")
                    || file.path().contains("\\") || file.path().contains("\0")
                    || !SAFE_PATH_PATTERN.matcher(file.path()).matches()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid workspace path");
            }
        });

        try {
            var restClient = RestClient.create(executionServiceUrl);
            var req = restClient.post()
                    .uri("/v1/execute")
                    .header("X-Confluo-Project", projectId)
                    .header("X-Runner-Token", executionServiceToken);

            return req.body(request)
                    .retrieve()
                    .body(ExecutionResponse.class);
        } catch (RuntimeException error) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Execution service is unavailable", error);
        }
    }

    private static void validateEntrypoint(ExecutionRequest request) {
        String entrypoint = request.entrypoint();
        if (entrypoint == null || entrypoint.isBlank()
                || entrypoint.contains("..") || entrypoint.startsWith("/")
                || entrypoint.contains("\\") || entrypoint.contains("\0")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid entrypoint");
        }

        String lang = request.language().toLowerCase();
        boolean isShell = lang.equals("shell") || lang.equals("bash") || lang.equals("sh");
        if (!isShell && !SAFE_PATH_PATTERN.matcher(entrypoint).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid entrypoint syntax");
        }
    }
}
