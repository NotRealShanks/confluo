package com.github.notrealshanks.confluobackend.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Data
@Document(collection = "documents")
@CompoundIndex(name = "members_user_idx", def = "{'members.userId': 1}")
public class EditorDocument {

    @Id
    private String id;

    private String title;

    // The owner is stored here with Role.OWNER; there is no separate ownerId to keep in sync
    private List<DocumentMember> members = new ArrayList<>();

    private Instant createdAt;
    private Instant updatedAt;

    public Optional<Role> roleOf(String userId) {
        return members.stream()
                .filter(m -> m.userId().equals(userId))
                .map(DocumentMember::role)
                .findFirst();
    }
}