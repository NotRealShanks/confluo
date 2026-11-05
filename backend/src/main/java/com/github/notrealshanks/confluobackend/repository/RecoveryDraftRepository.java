package com.github.notrealshanks.confluobackend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.github.notrealshanks.confluobackend.model.RecoveryDraft;

public interface RecoveryDraftRepository extends MongoRepository<RecoveryDraft, String> {

    Optional<RecoveryDraft> findByUserIdAndProjectIdAndFileId(String userId, String projectId, String fileId);

    List<RecoveryDraft> findAllByUserIdAndProjectId(String userId, String projectId);

    void deleteByUserIdAndProjectIdAndFileId(String userId, String projectId, String fileId);
}

