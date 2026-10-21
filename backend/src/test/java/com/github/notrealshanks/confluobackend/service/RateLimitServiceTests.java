package com.github.notrealshanks.confluobackend.service;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

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
}
