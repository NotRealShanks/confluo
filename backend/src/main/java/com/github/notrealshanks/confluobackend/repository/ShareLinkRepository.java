package com.github.notrealshanks.confluobackend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.github.notrealshanks.confluobackend.model.ShareLink;

public interface ShareLinkRepository extends MongoRepository<ShareLink, String> {

    Optional<ShareLink> findByTokenHash(String tokenHash);

    List<ShareLink> findByProjectIdOrderByCreatedAtDesc(String projectId);
}
