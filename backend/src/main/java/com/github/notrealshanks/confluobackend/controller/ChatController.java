package com.github.notrealshanks.confluobackend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.github.notrealshanks.confluobackend.dto.ChatMessagePageResponse;
import com.github.notrealshanks.confluobackend.dto.ChatMessageRequest;
import com.github.notrealshanks.confluobackend.dto.ChatMessageResponse;
import com.github.notrealshanks.confluobackend.security.GuestPrincipal;
import com.github.notrealshanks.confluobackend.service.ChatService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/projects/{projectId}/chat/messages")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @GetMapping
    public ChatMessagePageResponse list(
            Authentication authentication,
            @PathVariable String projectId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        verifyAuthenticatedMember(authentication);
        return chatService.listMessages(authentication.getName(), projectId, page, size);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ChatMessageResponse send(
            Authentication authentication,
            @PathVariable String projectId,
            @Valid @RequestBody ChatMessageRequest request) {
        verifyAuthenticatedMember(authentication);
        return chatService.sendMessage(authentication.getName(), projectId, request);
    }

    @GetMapping("/{messageId}")
    public ChatMessageResponse get(
            Authentication authentication,
            @PathVariable String projectId,
            @PathVariable String messageId) {
        verifyAuthenticatedMember(authentication);
        return chatService.getMessage(authentication.getName(), projectId, messageId);
    }

    private static void verifyAuthenticatedMember(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        if (authentication.getPrincipal() instanceof GuestPrincipal || authentication.getName().toLowerCase().startsWith("guest")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Guest users cannot access chat");
        }
    }
}

