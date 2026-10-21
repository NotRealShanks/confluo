package com.github.notrealshanks.confluobackend.service;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.Test;

class RateLimitServiceTests {

    @Test
    void keyChurnRemainsBoundedAndDoesNotExhaustTheLimiter() {
        RateLimitService service = new RateLimitService();

        for (int i = 0; i < 10_001; i++) {
            int key = i;
            assertDoesNotThrow(() -> service.check("attacker-controlled-" + key));
        }
    }

    @Test
    void concurrentRequestsShareOneWindow() throws InterruptedException {
        RateLimitService service = new RateLimitService();
        ExecutorService pool = Executors.newFixedThreadPool(32);
        AtomicInteger rejected = new AtomicInteger();

        for (int i = 0; i < 31; i++) {
            pool.submit(() -> {
                try {
                    service.check("same-key");
                } catch (RuntimeException exception) {
                    rejected.incrementAndGet();
                }
            });
        }

        pool.shutdown();
        org.junit.jupiter.api.Assertions.assertTrue(pool.awaitTermination(5, TimeUnit.SECONDS));
        assertEquals(1, rejected.get());
    }
}
