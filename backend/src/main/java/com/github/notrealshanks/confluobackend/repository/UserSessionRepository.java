package com.github.notrealshanks.confluobackend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.github.notrealshanks.confluobackend.model.SessionStatus;
import com.github.notrealshanks.confluobackend.model.UserSession;

public interface UserSessionRepository extends MongoRepository<UserSession, String> {

    Optional<UserSession> findBySelector(String selector);

    List<UserSession> findAllByUserIdAndStatus(String userId, SessionStatus status);

    List<UserSession> findAllByUserIdOrderByCreatedAtDesc(String userId);

    Optional<UserSession> findFirstByUserIdAndStatusOrderByCreatedAtDesc(String userId, SessionStatus status);

    void deleteAllByUserId(String userId);
}

