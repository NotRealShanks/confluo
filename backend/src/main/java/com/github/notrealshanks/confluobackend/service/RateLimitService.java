package com.github.notrealshanks.confluobackend.service;

import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RateLimitService {

    private static final int MAX_ATTEMPTS = 30;
    private static final int MAX_KEYS = 10_000;
    private static final Duration WINDOW = Duration.ofMinutes(1);

    private final Map<String, Window> windows = new HashMap<>();

    public synchronized void check(String key) {
        Instant now = Instant.now();
        windows.entrySet().removeIf(entry -> now.isAfter(entry.getValue().startedAt.plus(WINDOW)));
        Window current = windows.get(key);
        if (current == null) {
            if (windows.size() >= MAX_KEYS) {
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Too many requests");
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
