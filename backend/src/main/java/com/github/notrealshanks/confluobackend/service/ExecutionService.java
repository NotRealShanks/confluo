package com.github.notrealshanks.confluobackend.service;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

import com.github.notrealshanks.confluobackend.dto.ExecutionFile;
import com.github.notrealshanks.confluobackend.dto.ExecutionRequest;
import com.github.notrealshanks.confluobackend.dto.ExecutionResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ExecutionService {
    private static final Pattern SAFE_PATH_PATTERN = Pattern.compile("^[a-zA-Z0-9_\\-./]+$");
    public static final int MAX_FILES = 100;
    public static final int MAX_FILE_SIZE_BYTES = 200 * 1024; // 200 KB per file
    public static final int MAX_TOTAL_SIZE_BYTES = 1024 * 1024; // 1 MB total files payload
    public static final int HOURLY_RUN_QUOTA = 60;
    public static final int MAX_CONCURRENT_RUNS_PER_USER = 1;

    private final ProjectService projectService;
    private final RateLimitService rateLimitService;

    private final ConcurrentHashMap<String, AtomicInteger> userConcurrentRuns = new ConcurrentHashMap<>();

    @Value("${app.execution-service-url:}")
    private String executionServiceUrl;

    @Value("${app.execution-service-token:}")
    private String executionServiceToken;

    // Optional override for unit testing RestClient interactions
    RestClient restClientOverride;

    public ExecutionResponse execute(String userId, String projectId, ExecutionRequest request) {
        // Explicitly reject guest users
        if (userId == null || userId.isBlank() || userId.toLowerCase().startsWith("guest")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Guests are not allowed to execute code");
        }

        // Verify project access and require editor role
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

        // Enforce rate limiting: per-minute burst check and per-user hourly run quota
        rateLimitService.check("exec:" + userId);
        rateLimitService.check("exec-hourly:" + userId, HOURLY_RUN_QUOTA, Duration.ofHours(1));

        // Enforce per-user concurrent run cap
        AtomicInteger activeRuns = userConcurrentRuns.computeIfAbsent(userId, k -> new AtomicInteger(0));
        if (activeRuns.incrementAndGet() > MAX_CONCURRENT_RUNS_PER_USER) {
            activeRuns.decrementAndGet();
            throw new ResponseStatusException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "Concurrent execution limit reached. Please wait for your active run to finish.");
        }

        try {
            validatePayload(request);
            validateEntrypoint(request);

            RestClient restClient = getRestClient();
            return restClient.post()
                    .uri("/v1/execute")
                    .header("X-Confluo-Project", projectId)
                    .header("X-Runner-Token", executionServiceToken)
                    .body(request)
                    .retrieve()
                    .body(ExecutionResponse.class);
        } catch (RestClientResponseException ex) {
            int statusCode = ex.getStatusCode().value();
            if (statusCode == 401) {
                throw new ResponseStatusException(
                        HttpStatus.INTERNAL_SERVER_ERROR,
                        "Execution runner authentication failed. Verify service token configuration.", ex);
            } else if (statusCode == 429) {
                throw new ResponseStatusException(
                        HttpStatus.TOO_MANY_REQUESTS,
                        "Runner concurrency limit reached. Please wait for active runs to finish.", ex);
            } else if (statusCode == 400) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Invalid execution request: " + ex.getResponseBodyAsString(), ex);
            } else if (statusCode == 503) {
                throw new ResponseStatusException(
                        HttpStatus.SERVICE_UNAVAILABLE,
                        "Code execution service is temporarily unavailable. Please try again shortly.", ex);
            } else {
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "Execution runner returned an error: " + ex.getStatusText(), ex);
            }
        } catch (ResourceAccessException ex) {
            if (ex.getCause() instanceof java.net.SocketTimeoutException) {
                throw new ResponseStatusException(
                        HttpStatus.GATEWAY_TIMEOUT,
                        "Code execution timed out waiting for output from runner.", ex);
            }
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Cannot connect to the execution runner service. Please ensure the runner is running.", ex);
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (RuntimeException error) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Execution service communication failed", error);
        } finally {
            activeRuns.decrementAndGet();
        }
    }

    private RestClient getRestClient() {
        if (restClientOverride != null) {
            return restClientOverride;
        }
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(3));
        requestFactory.setReadTimeout(Duration.ofSeconds(40));

        return RestClient.builder()
                .baseUrl(executionServiceUrl)
                .requestFactory(requestFactory)
                .build();
    }

    private static void validatePayload(ExecutionRequest request) {
        if (request.files() == null || request.files().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Execution request must contain at least one file");
        }
        if (request.files().size() > MAX_FILES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File count exceeds limit of " + MAX_FILES + " files");
        }

        int totalSizeBytes = 0;
        for (ExecutionFile file : request.files()) {
            String path = file.path();
            if (path == null || path.isBlank() || path.length() > 200
                    || path.contains("..") || path.startsWith("/")
                    || path.contains("\\") || path.contains("\0")
                    || !SAFE_PATH_PATTERN.matcher(path).matches()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid workspace path");
            }

            int fileSize = file.content() != null ? file.content().getBytes(StandardCharsets.UTF_8).length : 0;
            if (fileSize > MAX_FILE_SIZE_BYTES) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "File " + path + " exceeds maximum size of 200 KB");
            }
            totalSizeBytes += fileSize;
            if (totalSizeBytes > MAX_TOTAL_SIZE_BYTES) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Total files payload exceeds maximum size of 1 MB");
            }
        }
    }

    private static void validateEntrypoint(ExecutionRequest request) {
        String entrypoint = request.entrypoint();
        if (entrypoint == null || entrypoint.isBlank() || entrypoint.length() > 200
                || entrypoint.contains("..") || entrypoint.startsWith("/")
                || entrypoint.contains("\\") || entrypoint.contains("\0")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid entrypoint");
        }

        String lang = request.language() != null ? request.language().toLowerCase() : "";
        boolean isShell = lang.equals("shell") || lang.equals("bash") || lang.equals("sh");
        if (!isShell && !SAFE_PATH_PATTERN.matcher(entrypoint).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid entrypoint syntax");
        }
    }
}
