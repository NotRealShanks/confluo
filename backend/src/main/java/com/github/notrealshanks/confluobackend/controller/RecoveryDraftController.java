package com.github.notrealshanks.confluobackend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.github.notrealshanks.confluobackend.dto.RecoveryDraftRequest;
import com.github.notrealshanks.confluobackend.dto.RecoveryDraftResponse;
import com.github.notrealshanks.confluobackend.security.GuestPrincipal;
import com.github.notrealshanks.confluobackend.service.RecoveryDraftService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/recovery/drafts")
@RequiredArgsConstructor
public class RecoveryDraftController {

    private final RecoveryDraftService recoveryDraftService;

    @PostMapping("/projects/{projectId}")
    public ResponseEntity<RecoveryDraftResponse> saveDraft(
            @PathVariable String projectId,
            @Valid @RequestBody RecoveryDraftRequest request,
            Authentication authentication) {
        String userId = requireUser(authentication);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(recoveryDraftService.saveDraft(userId, projectId, request.fileId(), request.content()));
    }

    @GetMapping("/projects/{projectId}")
    public ResponseEntity<List<RecoveryDraftResponse>> listDrafts(
            @PathVariable String projectId,
            Authentication authentication) {
        String userId = requireUser(authentication);
        return ResponseEntity.ok(recoveryDraftService.listDrafts(userId, projectId));
    }

    @GetMapping("/projects/{projectId}/file")
    public ResponseEntity<RecoveryDraftResponse> getDraft(
            @PathVariable String projectId,
            @RequestParam String fileId,
            Authentication authentication) {
        String userId = requireUser(authentication);
        return recoveryDraftService.getDraft(userId, projectId, fileId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/projects/{projectId}/file")
    public ResponseEntity<Void> deleteDraft(
            @PathVariable String projectId,
            @RequestParam String fileId,
            Authentication authentication) {
        String userId = requireUser(authentication);
        recoveryDraftService.deleteDraft(userId, projectId, fileId);
        return ResponseEntity.noContent().build();
    }

    private static String requireUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        if (authentication.getPrincipal() instanceof GuestPrincipal) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Guests cannot manage recovery drafts");
        }
        return authentication.getName();
    }
}
