package com.github.notrealshanks.confluobackend.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "users")
@Data
public class User {
    @Id
    private String id;

    private String email;
    private String name;
    private String avatarUrl;

    // "google", "github", or "local"
    private String provider;

    // Only set for provider="local" — OAuth users never have a password stored here
    private String passwordHash;
}
