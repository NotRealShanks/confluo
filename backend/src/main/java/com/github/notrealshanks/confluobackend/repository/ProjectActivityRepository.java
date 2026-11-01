package com.github.notrealshanks.confluobackend.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import com.github.notrealshanks.confluobackend.model.ProjectActivity;
import com.github.notrealshanks.confluobackend.model.ProjectActivityType;

public interface ProjectActivityRepository extends MongoRepository<ProjectActivity, String> {

    Page<ProjectActivity> findByProjectIdOrderByTimestampDesc(String projectId, Pageable pageable);

    Optional<ProjectActivity> findTopByProjectIdAndActionTypeAndActorIdOrderByTimestampDesc(
            String projectId, ProjectActivityType actionType, String actorId);

    Optional<ProjectActivity> findTopByProjectIdAndActionTypeAndActorIdAndTargetUserIdOrderByTimestampDesc(
            String projectId, ProjectActivityType actionType, String actorId, String targetUserId);

    boolean existsByProjectIdAndActionTypeAndActorId(
            String projectId, ProjectActivityType actionType, String actorId);
}

