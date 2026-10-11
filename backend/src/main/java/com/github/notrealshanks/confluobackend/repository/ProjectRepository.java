package com.github.notrealshanks.confluobackend.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.github.notrealshanks.confluobackend.model.Project;

public interface ProjectRepository extends MongoRepository<Project, String> {

    // Resolves to members.userId, served by the index on the model
    List<Project> findByMembersUserId(String userId);
}
