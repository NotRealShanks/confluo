package com.github.notrealshanks.confluobackend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.github.notrealshanks.confluobackend.dto.ExecutionRequest;
import com.github.notrealshanks.confluobackend.dto.ExecutionResponse;
import com.github.notrealshanks.confluobackend.security.GuestPrincipal;
import com.github.notrealshanks.confluobackend.service.ExecutionService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ExecutionController {
    private final ExecutionService executionService;

    @PostMapping("/{projectId}/run")
    public ExecutionResponse run(
            Authentication authentication,
            @PathVariable String projectId,
            @Valid @RequestBody ExecutionRequest request) {
        if (authentication == null || authentication.getPrincipal() instanceof GuestPrincipal) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Guests are not allowed to execute code");
        }
        return executionService.execute(authentication.getName(), projectId, request);
    }
}
