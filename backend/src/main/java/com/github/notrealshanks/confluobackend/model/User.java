package com.github.notrealshanks.confluobackend.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

@Document(collection = "users")
@Data
public class User {
    @Id
    private String id;

    @Indexed(unique = true)
    private String email;
    private String name;
    private String avatarUrl;

    // "google", "github", or "local"
    private String provider;

    // Provider-side stable ID (Google "sub", GitHub numeric id); null for provider="local"
    private String providerId;

    // Only set for provider="local" — OAuth users never have a password stored here
    private String passwordHash;
}
