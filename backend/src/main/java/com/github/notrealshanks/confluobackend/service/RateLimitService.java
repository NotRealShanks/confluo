package com.github.notrealshanks.confluobackend.service;

import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
/**
 * A bounded, single-instance rate limiter. It protects one application
 * instance from bursts, but does not coordinate limits across replicas or
 * survive restarts; deployments needing global limits should use a shared
 * rate-limit store.
 */
public class RateLimitService {

    private static final int MAX_ATTEMPTS = 30;
    private static final int MAX_KEYS = 10_000;
    private static final Duration WINDOW = Duration.ofMinutes(1);

    /*
     * This limiter is intentionally process-local. It bounds memory and limits
     * bursts per instance, but distributed deployments need a shared store.
     */
    private final Map<String, Window> windows = new LinkedHashMap<>();

    public synchronized void check(String key) {
        Instant now = Instant.now();
        windows.entrySet().removeIf(entry -> now.isAfter(entry.getValue().startedAt.plus(WINDOW)));
        Window current = windows.get(key);
        if (current == null) {
            if (windows.size() >= MAX_KEYS) {
                windows.remove(windows.keySet().iterator().next());
            }
            windows.put(key, new Window(now, 1));
            return;
        }
        if (current.attempts >= MAX_ATTEMPTS) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Too many requests");
        }
        windows.put(key, new Window(current.startedAt, current.attempts + 1));
    }

    private record Window(Instant startedAt, int attempts) {
    }
}
