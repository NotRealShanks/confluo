package com.github.notrealshanks.confluobackend.service;

import java.time.Duration;
import java.time.Instant;
import java.util.Collections;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.github.notrealshanks.confluobackend.dto.ChatMessagePageResponse;
import com.github.notrealshanks.confluobackend.dto.ChatMessageRequest;
import com.github.notrealshanks.confluobackend.dto.ChatMessageResponse;
import com.github.notrealshanks.confluobackend.model.ChatMessage;
import com.github.notrealshanks.confluobackend.model.User;
import com.github.notrealshanks.confluobackend.repository.ChatMessageRepository;
import com.github.notrealshanks.confluobackend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ChatService {

    private static final int MAX_PAGE_SIZE = 100;
    private static final int DEFAULT_PAGE_SIZE = 50;
    private static final int MAX_MESSAGE_LENGTH = 2000;
    public static final int CHAT_RATE_LIMIT_PER_MINUTE = 20;

    private final ProjectService projectService;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final RateLimitService rateLimitService;

    public ChatMessagePageResponse listMessages(String callerId, String projectId, int page, int size) {
        verifyNotGuest(callerId);
        // Enforces that caller is an active member of the project
        projectService.requireAccess(callerId, projectId);

        int validPage = Math.max(0, page);
        int validSize = (size <= 0) ? DEFAULT_PAGE_SIZE : Math.min(size, MAX_PAGE_SIZE);

        Pageable pageable = PageRequest.of(validPage, validSize);
        Page<ChatMessage> messagePage = chatMessageRepository.findByProjectIdOrderByCreatedAtDesc(projectId, pageable);

        // Map and reverse the list so it is in chronological order for UI rendering
        List<ChatMessageResponse> messages = new java.util.ArrayList<>(messagePage.getContent().stream()
                .map(ChatMessageResponse::from)
                .toList());
        Collections.reverse(messages);

        return new ChatMessagePageResponse(
                messages,
                messagePage.getNumber(),
                messagePage.getSize(),
                messagePage.getTotalElements(),
                messagePage.getTotalPages(),
                messagePage.hasNext()
        );
    }

    public ChatMessageResponse sendMessage(String callerId, String projectId, ChatMessageRequest request) {
        verifyNotGuest(callerId);
        // Enforces that caller is an active member (OWNER, EDITOR, or VIEWER)
        projectService.requireAccess(callerId, projectId);

        if (request == null || request.message() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Message cannot be empty");
        }

        // Rate limit to 20 messages per minute per user
        rateLimitService.check("chat:" + callerId, CHAT_RATE_LIMIT_PER_MINUTE, Duration.ofMinutes(1));

        // Strip control characters (except standard whitespace: newline, tab, carriage return)
        String sanitizedMessage = stripControlCharacters(request.message()).trim();
        if (sanitizedMessage.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Message cannot be empty");
        }
        if (sanitizedMessage.length() > MAX_MESSAGE_LENGTH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Message cannot exceed " + MAX_MESSAGE_LENGTH + " characters");
        }

        User sender = userRepository.findById(callerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User no longer exists"));

        String senderName = displayName(sender);
        String senderAvatarUrl = sender.getAvatarUrl();

        ChatMessage chatMessage = ChatMessage.builder()
                .projectId(projectId)
                .senderUserId(callerId)
                .senderName(senderName)
                .senderAvatarUrl(senderAvatarUrl)
                .message(sanitizedMessage)
                .createdAt(Instant.now())
                .build();

        ChatMessage saved = chatMessageRepository.save(chatMessage);
        return ChatMessageResponse.from(saved);
    }

    public ChatMessageResponse getMessage(String callerId, String projectId, String messageId) {
        verifyNotGuest(callerId);
        projectService.requireAccess(callerId, projectId);

        ChatMessage chatMessage = chatMessageRepository.findByIdAndProjectId(messageId, projectId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Message not found"));

        return ChatMessageResponse.from(chatMessage);
    }

    public static String stripControlCharacters(String input) {
        if (input == null) {
            return "";
        }
        // Matches control characters except newline (\n), carriage return (\r), and horizontal tab (\t)
        return input.replaceAll("[\\p{Cntrl}&&[^\r\n\t]]", "");
    }

    private static void verifyNotGuest(String callerId) {
        if (callerId == null || callerId.isBlank() || callerId.toLowerCase().startsWith("guest")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Guests are not allowed to access chat");
        }
    }

    private static String displayName(User user) {
        String name = user.getName();
        boolean unusable = name == null
                || name.isBlank()
                || name.trim().equalsIgnoreCase(user.getEmail());
        return unusable ? "Anonymous" : name.trim();
    }
}
