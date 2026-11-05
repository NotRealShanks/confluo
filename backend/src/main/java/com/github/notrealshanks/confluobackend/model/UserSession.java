package com.github.notrealshanks.confluobackend.model;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "user_sessions")
public class UserSession {

    @Id
    private String id;

    @Indexed
    private String userId;

    @Indexed(unique = true)
    private String selector;

    private String verifierHash;

    private Instant createdAt;

    @Indexed(expireAfter = "0s")
    private Instant expiresAt;

    private Instant lastUsedAt;

    private Instant revokedAt;

    private SessionStatus status;

    private String ipAddress;

    private String userAgent;

    private String deviceInfo;
}
