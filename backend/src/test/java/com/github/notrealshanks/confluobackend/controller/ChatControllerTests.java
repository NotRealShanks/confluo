package com.github.notrealshanks.confluobackend.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.server.ResponseStatusException;

import com.github.notrealshanks.confluobackend.dto.ChatMessagePageResponse;
import com.github.notrealshanks.confluobackend.dto.ChatMessageRequest;
import com.github.notrealshanks.confluobackend.dto.ChatMessageResponse;
import com.github.notrealshanks.confluobackend.security.GuestPrincipal;
import com.github.notrealshanks.confluobackend.service.ChatService;

class ChatControllerTests {

    private ChatService chatService;
    private ChatController chatController;

    private final Authentication ownerAuth = UsernamePasswordAuthenticationToken.authenticated(
            "user-owner", null, List.of());
    private final Authentication editorAuth = UsernamePasswordAuthenticationToken.authenticated(
            "user-editor", null, List.of());
    private final Authentication viewerAuth = UsernamePasswordAuthenticationToken.authenticated(
            "user-viewer", null, List.of());
    private final Authentication guestAuth = UsernamePasswordAuthenticationToken.authenticated(
            new GuestPrincipal("guest-1", "project-1", "link-1"), null, List.of());

    @BeforeEach
    void setUp() {
        chatService = mock(ChatService.class);
        chatController = new ChatController(chatService);
    }

    @Test
    void ownerCanListAndSendMessages() {
        ChatMessageResponse msg = new ChatMessageResponse(
                "msg-1", "project-1", "user-owner", "Alice", null, "Hello world", Instant.now());
        ChatMessagePageResponse page = new ChatMessagePageResponse(
                List.of(msg), 0, 50, 1, 1, false);

        when(chatService.listMessages("user-owner", "project-1", 0, 50)).thenReturn(page);
        when(chatService.sendMessage(eq("user-owner"), eq("project-1"), eq(new ChatMessageRequest("Hello world"))))
                .thenReturn(msg);

        ChatMessagePageResponse listResult = chatController.list(ownerAuth, "project-1", 0, 50);
        assertEquals(1, listResult.messages().size());
        assertEquals("Hello world", listResult.messages().get(0).message());

        ChatMessageResponse sendResult = chatController.send(
                ownerAuth, "project-1", new ChatMessageRequest("Hello world"));
        assertNotNull(sendResult);
        assertEquals("msg-1", sendResult.id());
    }

    @Test
    void editorCanSendMessages() {
        ChatMessageResponse msg = new ChatMessageResponse(
                "msg-2", "project-1", "user-editor", "Bob", null, "Editor message", Instant.now());
        when(chatService.sendMessage(eq("user-editor"), eq("project-1"), eq(new ChatMessageRequest("Editor message"))))
                .thenReturn(msg);

        ChatMessageResponse result = chatController.send(
                editorAuth, "project-1", new ChatMessageRequest("Editor message"));
        assertEquals("user-editor", result.senderUserId());
        verify(chatService).sendMessage("user-editor", "project-1", new ChatMessageRequest("Editor message"));
    }

    @Test
    void viewerCanReadAndSendMessages() {
        ChatMessageResponse msg = new ChatMessageResponse(
                "msg-3", "project-1", "user-viewer", "Charlie", null, "Viewer question", Instant.now());
        when(chatService.sendMessage(eq("user-viewer"), eq("project-1"), eq(new ChatMessageRequest("Viewer question"))))
                .thenReturn(msg);

        ChatMessageResponse result = chatController.send(
                viewerAuth, "project-1", new ChatMessageRequest("Viewer question"));
        assertEquals("user-viewer", result.senderUserId());
        verify(chatService).sendMessage("user-viewer", "project-1", new ChatMessageRequest("Viewer question"));
    }

    @Test
    void guestCannotAccessChat() {
        ResponseStatusException listEx = assertThrows(ResponseStatusException.class,
                () -> chatController.list(guestAuth, "project-1", 0, 50));
        assertEquals(HttpStatus.FORBIDDEN, listEx.getStatusCode());

        ResponseStatusException sendEx = assertThrows(ResponseStatusException.class,
                () -> chatController.send(guestAuth, "project-1", new ChatMessageRequest("Hi")));
        assertEquals(HttpStatus.FORBIDDEN, sendEx.getStatusCode());

        ResponseStatusException getEx = assertThrows(ResponseStatusException.class,
                () -> chatController.get(guestAuth, "project-1", "msg-1"));
        assertEquals(HttpStatus.FORBIDDEN, getEx.getStatusCode());
    }

    @Test
    void unauthenticatedRequestIsRejected() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> chatController.list(null, "project-1", 0, 50));
        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
    }

    @Test
    void senderIdentityComesFromAuthenticationAndCannotBeSpoofed() {
        ChatMessageRequest request = new ChatMessageRequest("Spoofed message");
        ChatMessageResponse msg = new ChatMessageResponse(
                "msg-4", "project-1", "user-owner", "Alice", null, "Spoofed message", Instant.now());

        when(chatService.sendMessage("user-owner", "project-1", request)).thenReturn(msg);

        ChatMessageResponse result = chatController.send(ownerAuth, "project-1", request);
        assertEquals("user-owner", result.senderUserId());
        verify(chatService).sendMessage("user-owner", "project-1", request);
    }
}

