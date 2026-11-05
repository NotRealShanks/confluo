package com.github.notrealshanks.confluobackend.service;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class SessionSseManager {

    private static final long SSE_TIMEOUT = 30 * 60 * 1000L; // 30 minutes
    private final Map<String, List<SseEmitter>> userEmitters = new ConcurrentHashMap<>();

    public SseEmitter register(String userId) {
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT);
        List<SseEmitter> list = userEmitters.computeIfAbsent(userId, k -> new CopyOnWriteArrayList<>());
        list.add(emitter);

        Runnable cleanup = () -> {
            list.remove(emitter);
            if (list.isEmpty()) {
                userEmitters.remove(userId);
            }
        };

        emitter.onCompletion(cleanup);
        emitter.onTimeout(cleanup);
        emitter.onError(e -> cleanup.run());

        try {
            emitter.send(SseEmitter.event().name("INIT").data(Map.of("status", "connected")));
        } catch (IOException e) {
            cleanup.run();
        }

        return emitter;
    }

    public void notifySessionTerminated(String userId, String reason) {
        List<SseEmitter> list = userEmitters.get(userId);
        if (list == null || list.isEmpty()) {
            return;
        }

        for (SseEmitter emitter : list) {
            try {
                emitter.send(SseEmitter.event()
                        .name("SESSION_TERMINATED")
                        .data(Map.of("reason", reason)));
                emitter.complete();
            } catch (Exception e) {
                log.debug("Error sending session termination SSE to user {}: {}", userId, e.getMessage());
            }
        }
        userEmitters.remove(userId);
    }
}

