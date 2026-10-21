package com.github.notrealshanks.confluobackend.model;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Data
@Document(collection = "shareLinks")
public class ShareLink {

    @Id
    private String id;

    private String projectId;

    @Indexed(unique = true)
    private String tokenHash;

    private Instant createdAt;
    private Instant expiresAt;
    private Instant revokedAt;

    public boolean isActive(Instant now) {
        return revokedAt == null && (expiresAt == null || expiresAt.isAfter(now));
    }
}
