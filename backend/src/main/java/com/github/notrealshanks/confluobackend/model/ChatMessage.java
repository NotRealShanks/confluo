package com.github.notrealshanks.confluobackend.model;

import java.time.Instant;

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
@Document(collection = "chat_messages")
@CompoundIndex(name = "project_created_idx", def = "{'projectId': 1, 'createdAt': -1}")
public class ChatMessage {

    @Id
    private String id;

    private String projectId;

    private String senderUserId;

    private String senderName;

    private String senderAvatarUrl;

    private String message;

    private Instant createdAt;
}

