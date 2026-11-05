package com.github.notrealshanks.confluobackend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.github.notrealshanks.confluobackend.dto.git.*;
import com.github.notrealshanks.confluobackend.model.User;
import com.github.notrealshanks.confluobackend.repository.UserRepository;
import com.github.notrealshanks.confluobackend.security.GuestPrincipal;
import com.github.notrealshanks.confluobackend.service.GitService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/git/{projectId}")
@RequiredArgsConstructor
public class GitController {

    private final GitService gitService;
    private final UserRepository userRepository;

    @PostMapping("/init")
    public ResponseEntity<Void> init(
            @PathVariable String projectId,
            Authentication authentication) {
        String userId = requireUser(authentication);
        User user = userRepository.findById(userId).orElse(null);
        String name = (user != null && user.getName() != null && !user.getName().isBlank()) ? user.getName().trim() : "Confluo Developer";
        String email = (user != null && user.getEmail() != null && !user.getEmail().isBlank()) ? user.getEmail().trim() : "dev@confluo.local";

        gitService.init(userId, projectId, name, email);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @GetMapping("/status")
    public ResponseEntity<GitStatusResponse> status(
            @PathVariable String projectId,
            Authentication authentication) {
        String userId = requireUser(authentication);
        return ResponseEntity.ok(gitService.getStatus(userId, projectId));
    }

    @PostMapping("/sync")
    public ResponseEntity<Void> sync(
            @PathVariable String projectId,
            @RequestBody GitSyncRequest request,
            Authentication authentication) {
        String userId = requireUser(authentication);
        gitService.syncWorkingTree(userId, projectId, request.files());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/stage")
    public ResponseEntity<Void> stage(
            @PathVariable String projectId,
            @RequestBody GitStageRequest request,
            Authentication authentication) {
        String userId = requireUser(authentication);
        gitService.stage(userId, projectId, request.paths());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/unstage")
    public ResponseEntity<Void> unstage(
            @PathVariable String projectId,
            @RequestBody GitStageRequest request,
            Authentication authentication) {
        String userId = requireUser(authentication);
        gitService.unstage(userId, projectId, request.paths());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/discard")
    public ResponseEntity<Void> discard(
            @PathVariable String projectId,
            @RequestBody GitStageRequest request,
            Authentication authentication) {
        String userId = requireUser(authentication);
        gitService.discard(userId, projectId, request.paths());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/commit")
    public ResponseEntity<Void> commit(
            @PathVariable String projectId,
            @Valid @RequestBody GitCommitRequest request,
            Authentication authentication) {
        String userId = requireUser(authentication);
        User user = userRepository.findById(userId).orElse(null);
        String name = (user != null && user.getName() != null && !user.getName().isBlank()) ? user.getName().trim() : "Confluo Developer";
        String email = (user != null && user.getEmail() != null && !user.getEmail().isBlank()) ? user.getEmail().trim() : "dev@confluo.local";

        gitService.commit(userId, projectId, request.message(), name, email);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @GetMapping("/log")
    public ResponseEntity<List<GitCommitDTO>> log(
            @PathVariable String projectId,
            @RequestParam(defaultValue = "20") int limit,
            Authentication authentication) {
        String userId = requireUser(authentication);
        return ResponseEntity.ok(gitService.getLog(userId, projectId, limit));
    }

    @GetMapping("/diff")
    public ResponseEntity<String> diff(
            @PathVariable String projectId,
            @RequestParam String path,
            @RequestParam(defaultValue = "false") boolean staged,
            Authentication authentication) {
        String userId = requireUser(authentication);
        return ResponseEntity.ok(gitService.getDiff(userId, projectId, path, staged));
    }

    @GetMapping("/branches")
    public ResponseEntity<GitBranchesResponse> branches(
            @PathVariable String projectId,
            Authentication authentication) {
        String userId = requireUser(authentication);
        return ResponseEntity.ok(gitService.getBranches(userId, projectId));
    }

    @PostMapping("/branches")
    public ResponseEntity<Void> createBranch(
            @PathVariable String projectId,
            @Valid @RequestBody GitBranchRequest request,
            Authentication authentication) {
        String userId = requireUser(authentication);
        gitService.createBranch(userId, projectId, request.branchName());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PostMapping("/checkout")
    public ResponseEntity<Map<String, String>> checkout(
            @PathVariable String projectId,
            @Valid @RequestBody GitBranchRequest request,
            Authentication authentication) {
        String userId = requireUser(authentication);
        gitService.checkout(userId, projectId, request.branchName());
        Map<String, String> workingTree = gitService.readWorkingTree(userId, projectId);
        return ResponseEntity.ok(workingTree);
    }

    @GetMapping("/remote")
    public ResponseEntity<GitRemoteResponse> getRemote(
            @PathVariable String projectId,
            Authentication authentication) {
        String userId = requireUser(authentication);
        return ResponseEntity.ok(gitService.getRemote(userId, projectId));
    }

    @PostMapping("/remote")
    public ResponseEntity<Void> setRemote(
            @PathVariable String projectId,
            @Valid @RequestBody GitRemoteRequest request,
            Authentication authentication) {
        String userId = requireUser(authentication);
        gitService.setRemote(userId, projectId, request.remoteUrl());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/push")
    public ResponseEntity<Map<String, String>> push(
            @PathVariable String projectId,
            @RequestBody GitSyncRemoteRequest request,
            Authentication authentication) {
        String userId = requireUser(authentication);
        String output = gitService.push(userId, projectId, request.remoteUrl(), request.branch(), request.username(), request.token());
        return ResponseEntity.ok(Map.of("output", output));
    }

    @PostMapping("/pull")
    public ResponseEntity<Map<String, Object>> pull(
            @PathVariable String projectId,
            @RequestBody GitSyncRemoteRequest request,
            Authentication authentication) {
        String userId = requireUser(authentication);
        String output = gitService.pull(userId, projectId, request.remoteUrl(), request.branch(), request.username(), request.token());
        Map<String, String> workingTree = gitService.readWorkingTree(userId, projectId);
        return ResponseEntity.ok(Map.of("output", output, "files", workingTree));
    }

    private static String requireUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        if (authentication.getPrincipal() instanceof GuestPrincipal) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Guests cannot use Git source control");
        }
        return authentication.getName();
    }
}
