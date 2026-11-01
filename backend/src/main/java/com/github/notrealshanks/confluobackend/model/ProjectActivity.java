package com.github.notrealshanks.confluobackend.model;

import java.time.Instant;
import java.util.Map;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "project_activities")
@CompoundIndex(name = "project_timestamp_idx", def = "{'projectId': 1, 'timestamp': -1}")
public class ProjectActivity {

    @Id
    private String id;

    private String projectId;

    private String actorId;

    private ProjectActivityType actionType;

    private String targetUserId;

    private Map<String, Object> metadata;

    private Instant timestamp;
}

