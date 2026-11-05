package com.github.notrealshanks.confluobackend.model;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
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
@Document(collection = "recovery_drafts")
@CompoundIndexes({
        @CompoundIndex(name = "user_project_file_idx", def = "{'userId': 1, 'projectId': 1, 'fileId': 1}", unique = true)
})
public class RecoveryDraft {

    @Id
    private String id;

    @Indexed
    private String userId;

    @Indexed
    private String projectId;

    private String fileId;

    private String content;

    private Instant updatedAt;

    @Indexed(expireAfter = "0s")
    private Instant expiresAt;
}

