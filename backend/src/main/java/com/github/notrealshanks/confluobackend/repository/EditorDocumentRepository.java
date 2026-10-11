package com.github.notrealshanks.confluobackend.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.github.notrealshanks.confluobackend.model.EditorDocument;

public interface EditorDocumentRepository extends MongoRepository<EditorDocument, String> {

    // Resolves to members.userId, served by the index on the model
    List<EditorDocument> findByMembersUserId(String userId);
}