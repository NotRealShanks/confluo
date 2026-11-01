package com.github.notrealshanks.confluobackend.service;

import java.time.Duration;
import java.time.Instant;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.github.notrealshanks.confluobackend.dto.ProjectActivityPageResponse;
import com.github.notrealshanks.confluobackend.dto.ProjectActivityResponse;
import com.github.notrealshanks.confluobackend.model.ProjectActivity;
import com.github.notrealshanks.confluobackend.model.ProjectActivityType;
import com.github.notrealshanks.confluobackend.model.User;
import com.github.notrealshanks.confluobackend.repository.ProjectActivityRepository;
import com.github.notrealshanks.confluobackend.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProjectActivityService {

    private static final int DEFAULT_PAGE_SIZE = 20;
    private static final int MAX_PAGE_SIZE = 50;
    private static final Duration DEDUPLICATION_WINDOW = Duration.ofSeconds(5);
    private static final Pattern SENSITIVE_KEY_PATTERN =
            Pattern.compile(".*(password|token|secret|auth|credential).*", Pattern.CASE_INSENSITIVE);

    private final ProjectActivityRepository projectActivityRepository;
    private final ProjectService projectService;
    private final UserRepository userRepository;

    public void recordActivity(
            String projectId,
            String actorId,
            ProjectActivityType actionType,
            String targetUserId,
            Map<String, Object> metadata) {

        if (projectId == null || actorId == null || actionType == null) {
            log.warn("Skipping project activity record with missing required parameters: projectId={}, actorId={}, actionType={}",
                    projectId, actorId, actionType);
            return;
        }

        try {
            // Deduplication guard for repeated / retried operations
            Instant now = Instant.now();
            if (actionType == ProjectActivityType.MEMBER_JOINED) {
                if (projectActivityRepository.existsByProjectIdAndActionTypeAndActorId(projectId, actionType, actorId)) {
                    log.debug("Member join activity already recorded for user {} in project {}", actorId, projectId);
                    return;
                }
            } else {
                var recentActivityOpt = projectActivityRepository
                        .findTopByProjectIdAndActionTypeAndActorIdAndTargetUserIdOrderByTimestampDesc(
                                projectId, actionType, actorId, targetUserId);

                if (recentActivityOpt.isPresent()) {
                    ProjectActivity recent = recentActivityOpt.get();
                    if (recent.getTimestamp() != null
                            && Duration.between(recent.getTimestamp(), now).compareTo(DEDUPLICATION_WINDOW) <= 0) {
                        log.debug("Duplicate project activity suppressed for projectId={}, actionType={}, actorId={}, targetUserId={}",
                                projectId, actionType, actorId, targetUserId);
                        return;
                    }
                }
            }

            Map<String, Object> sanitizedMetadata = sanitizeMetadata(metadata);

            ProjectActivity activity = ProjectActivity.builder()
                    .projectId(projectId)
                    .actorId(actorId)
                    .actionType(actionType)
                    .targetUserId(targetUserId)
                    .metadata(sanitizedMetadata)
                    .timestamp(now)
                    .build();

            projectActivityRepository.save(activity);
        } catch (Exception e) {
            // Ensure activity logging failure never disrupts primary business operations
            log.error("Failed to record project activity for project {}: {}", projectId, e.getMessage(), e);
        }
    }

    public ProjectActivityPageResponse listActivities(String callerId, String projectId, int page, int size) {
        // Enforce that caller currently has access to the project
        projectService.requireAccess(callerId, projectId);

        int validPage = Math.max(0, page);
        int validSize = (size <= 0) ? DEFAULT_PAGE_SIZE : Math.min(size, MAX_PAGE_SIZE);

        Pageable pageable = PageRequest.of(validPage, validSize);
        Page<ProjectActivity> activityPage =
                projectActivityRepository.findByProjectIdOrderByTimestampDesc(projectId, pageable);

        Set<String> userIds = new HashSet<>();
        for (ProjectActivity act : activityPage.getContent()) {
            if (act.getActorId() != null) userIds.add(act.getActorId());
            if (act.getTargetUserId() != null) userIds.add(act.getTargetUserId());
        }

        Map<String, User> userMap = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        List<ProjectActivityResponse> responses = activityPage.getContent().stream()
                .map(act -> toResponse(act, userMap))
                .toList();

        return new ProjectActivityPageResponse(
                responses,
                activityPage.getNumber(),
                activityPage.getSize(),
                activityPage.getTotalElements(),
                activityPage.getTotalPages(),
                activityPage.hasNext()
        );
    }

    private static Map<String, Object> sanitizeMetadata(Map<String, Object> metadata) {
        if (metadata == null || metadata.isEmpty()) {
            return Collections.emptyMap();
        }
        Map<String, Object> sanitized = new HashMap<>();
        for (Map.Entry<String, Object> entry : metadata.entrySet()) {
            if (entry.getKey() != null && entry.getValue() != null) {
                if (!SENSITIVE_KEY_PATTERN.matcher(entry.getKey()).matches()) {
                    sanitized.put(entry.getKey(), entry.getValue());
                }
            }
        }
        return sanitized;
    }

    private static ProjectActivityResponse toResponse(ProjectActivity act, Map<String, User> userMap) {
        String actorName = resolveUserName(act.getActorId(), userMap);
        String targetUserName = resolveUserName(act.getTargetUserId(), userMap);

        return new ProjectActivityResponse(
                act.getId(),
                act.getProjectId(),
                act.getActorId(),
                actorName,
                act.getActionType(),
                act.getTargetUserId(),
                targetUserName,
                act.getMetadata(),
                act.getTimestamp()
        );
    }

    private static String resolveUserName(String userId, Map<String, User> userMap) {
        if (userId == null) return null;
        if ("SYSTEM".equalsIgnoreCase(userId)) return "System";
        User user = userMap.get(userId);
        if (user == null) return "Unknown user";
        String name = user.getName();
        if (name == null || name.isBlank() || name.trim().equalsIgnoreCase(user.getEmail())) {
            return user.getEmail() != null ? user.getEmail() : "Unknown user";
        }
        return name.trim();
    }
}

