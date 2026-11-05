package com.github.notrealshanks.confluobackend.service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.github.notrealshanks.confluobackend.dto.RecoveryDraftResponse;
import com.github.notrealshanks.confluobackend.model.RecoveryDraft;
import com.github.notrealshanks.confluobackend.repository.RecoveryDraftRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RecoveryDraftService {

    private static final long DRAFT_TTL_DAYS = 7;
    private final RecoveryDraftRepository recoveryDraftRepository;
    private final ProjectService projectService;

    public RecoveryDraftResponse saveDraft(String userId, String projectId, String fileId, String content) {
        // Enforce access control on the project
        projectService.requireAccess(userId, projectId);

        Instant now = Instant.now();
        Instant expiresAt = now.plus(DRAFT_TTL_DAYS, ChronoUnit.DAYS);

        RecoveryDraft draft = recoveryDraftRepository.findByUserIdAndProjectIdAndFileId(userId, projectId, fileId)
                .orElseGet(() -> RecoveryDraft.builder()
                        .userId(userId)
                        .projectId(projectId)
                        .fileId(fileId)
                        .build());

        draft.setContent(content != null ? content : "");
        draft.setUpdatedAt(now);
        draft.setExpiresAt(expiresAt);

        RecoveryDraft saved = recoveryDraftRepository.save(draft);
        return RecoveryDraftResponse.from(saved);
    }

    public Optional<RecoveryDraftResponse> getDraft(String userId, String projectId, String fileId) {
        projectService.requireAccess(userId, projectId);
        return recoveryDraftRepository.findByUserIdAndProjectIdAndFileId(userId, projectId, fileId)
                .map(RecoveryDraftResponse::from);
    }

    public List<RecoveryDraftResponse> listDrafts(String userId, String projectId) {
        projectService.requireAccess(userId, projectId);
        return recoveryDraftRepository.findAllByUserIdAndProjectId(userId, projectId).stream()
                .map(RecoveryDraftResponse::from)
                .toList();
    }

    public void deleteDraft(String userId, String projectId, String fileId) {
        projectService.requireAccess(userId, projectId);
        recoveryDraftRepository.deleteByUserIdAndProjectIdAndFileId(userId, projectId, fileId);
    }
}

