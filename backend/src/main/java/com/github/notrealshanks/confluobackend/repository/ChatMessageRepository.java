package com.github.notrealshanks.confluobackend.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import com.github.notrealshanks.confluobackend.model.ChatMessage;

public interface ChatMessageRepository extends MongoRepository<ChatMessage, String> {

    Page<ChatMessage> findByProjectIdOrderByCreatedAtDesc(String projectId, Pageable pageable);

    Optional<ChatMessage> findByIdAndProjectId(String id, String projectId);
}

