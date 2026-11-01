package com.github.notrealshanks.confluobackend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.github.notrealshanks.confluobackend.dto.ChatMessagePageResponse;
import com.github.notrealshanks.confluobackend.dto.ChatMessageRequest;
import com.github.notrealshanks.confluobackend.dto.ChatMessageResponse;
import com.github.notrealshanks.confluobackend.model.ChatMessage;
import com.github.notrealshanks.confluobackend.model.Project;
import com.github.notrealshanks.confluobackend.model.ProjectMember;
import com.github.notrealshanks.confluobackend.model.Role;
import com.github.notrealshanks.confluobackend.model.User;
import com.github.notrealshanks.confluobackend.repository.ChatMessageRepository;
import com.github.notrealshanks.confluobackend.repository.UserRepository;

class ChatServiceTests {

    private ProjectService projectService;
    private ChatMessageRepository chatMessageRepository;
    private UserRepository userRepository;
    private RateLimitService rateLimitService;
    private ChatService chatService;

    @BeforeEach
    void setUp() {
        projectService = mock(ProjectService.class);
        chatMessageRepository = mock(ChatMessageRepository.class);
        userRepository = mock(UserRepository.class);
        rateLimitService = mock(RateLimitService.class);
        chatService = new ChatService(projectService, chatMessageRepository, userRepository, rateLimitService);
    }

    @Test
    void memberCanSendMessageSuccessfully() {
        Project project = new Project();
        project.setId("proj-1");
        project.getMembers().add(new ProjectMember("user-1", Role.EDITOR));

        when(projectService.requireAccess("user-1", "proj-1"))
                .thenReturn(new ProjectService.Access(project, Role.EDITOR));

        User user = new User();
        user.setId("user-1");
        user.setName("Alice Cooper");
        user.setAvatarUrl("https://example.com/avatar.png");
        when(userRepository.findById("user-1")).thenReturn(Optional.of(user));

        when(chatMessageRepository.save(any(ChatMessage.class))).thenAnswer(invocation -> {
            ChatMessage saved = invocation.getArgument(0);
            saved.setId("msg-generated-id");
            return saved;
        });

        ChatMessageResponse response = chatService.sendMessage(
                "user-1", "proj-1", new ChatMessageRequest("Hello team!"));

        assertNotNull(response);
        assertEquals("msg-generated-id", response.id());
        assertEquals("proj-1", response.projectId());
        assertEquals("user-1", response.senderUserId());
        assertEquals("Alice Cooper", response.senderName());
        assertEquals("https://example.com/avatar.png", response.senderAvatarUrl());
        assertEquals("Hello team!", response.message());
        assertNotNull(response.createdAt());

        verify(rateLimitService).check("chat:user-1", 20, Duration.ofMinutes(1));
    }

    @Test
    void rateLimitOf20MessagesPerMinuteIsEnforced() {
        Project project = new Project();
        project.setId("proj-1");
        when(projectService.requireAccess("user-1", "proj-1"))
                .thenReturn(new ProjectService.Access(project, Role.EDITOR));

        doThrow(new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Too many requests"))
                .when(rateLimitService).check("chat:user-1", 20, Duration.ofMinutes(1));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                chatService.sendMessage("user-1", "proj-1", new ChatMessageRequest("Hello!")));

        assertEquals(HttpStatus.TOO_MANY_REQUESTS, ex.getStatusCode());
    }

    @Test
    void guestIsRejectedExplicitly() {
        ResponseStatusException ex1 = assertThrows(ResponseStatusException.class, () ->
                chatService.sendMessage("guest:abc-123", "proj-1", new ChatMessageRequest("Hello!")));
        assertEquals(HttpStatus.FORBIDDEN, ex1.getStatusCode());
        assertEquals("Guests are not allowed to access chat", ex1.getReason());

        ResponseStatusException ex2 = assertThrows(ResponseStatusException.class, () ->
                chatService.listMessages("guest", "proj-1", 0, 50));
        assertEquals(HttpStatus.FORBIDDEN, ex2.getStatusCode());
    }

    @Test
    void controlCharactersAreStrippedWhilePreservingNewlinesAndTabs() {
        Project project = new Project();
        project.setId("proj-1");
        when(projectService.requireAccess("user-1", "proj-1"))
                .thenReturn(new ProjectService.Access(project, Role.EDITOR));

        User user = new User();
        user.setId("user-1");
        user.setName("Alice");
        when(userRepository.findById("user-1")).thenReturn(Optional.of(user));

        when(chatMessageRepository.save(any(ChatMessage.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // String with null byte, bell \u0007, escape \u001B, but with newline and tab
        String rawWithControls = "Hello\u0000 World\u0007!\n\tLine 2\u001B";
        ChatMessageResponse response = chatService.sendMessage(
                "user-1", "proj-1", new ChatMessageRequest(rawWithControls));

        assertEquals("Hello World!\n\tLine 2", response.message());
    }

    @Test
    void messageContainingOnlyControlCharactersIsRejectedAsEmpty() {
        Project project = new Project();
        project.setId("proj-1");
        when(projectService.requireAccess("user-1", "proj-1"))
                .thenReturn(new ProjectService.Access(project, Role.EDITOR));

        String onlyControls = "\u0000\u0001\u0007\u001B   ";
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                chatService.sendMessage("user-1", "proj-1", new ChatMessageRequest(onlyControls)));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertEquals("Message cannot be empty", ex.getReason());
    }

    @Test
    void blankOrEmptyMessageIsRejected() {
        Project project = new Project();
        project.setId("proj-1");
        when(projectService.requireAccess("user-1", "proj-1"))
                .thenReturn(new ProjectService.Access(project, Role.OWNER));

        ResponseStatusException ex1 = assertThrows(ResponseStatusException.class,
                () -> chatService.sendMessage("user-1", "proj-1", new ChatMessageRequest("")));
        assertEquals(HttpStatus.BAD_REQUEST, ex1.getStatusCode());

        ResponseStatusException ex2 = assertThrows(ResponseStatusException.class,
                () -> chatService.sendMessage("user-1", "proj-1", new ChatMessageRequest("   \n\t  ")));
        assertEquals(HttpStatus.BAD_REQUEST, ex2.getStatusCode());
    }

    @Test
    void listMessagesReturnsChronologicalOrder() {
        Project project = new Project();
        project.setId("proj-1");
        when(projectService.requireAccess("user-1", "proj-1"))
                .thenReturn(new ProjectService.Access(project, Role.OWNER));

        ChatMessage msg1 = ChatMessage.builder()
                .id("m1").projectId("proj-1").senderUserId("user-1").message("first")
                .createdAt(Instant.now().minusSeconds(10)).build();
        ChatMessage msg2 = ChatMessage.builder()
                .id("m2").projectId("proj-1").senderUserId("user-2").message("second")
                .createdAt(Instant.now()).build();

        Pageable pageable = PageRequest.of(0, 50);
        when(chatMessageRepository.findByProjectIdOrderByCreatedAtDesc("proj-1", pageable))
                .thenReturn(new PageImpl<>(List.of(msg2, msg1), pageable, 2));

        ChatMessagePageResponse response = chatService.listMessages("user-1", "proj-1", 0, 50);
        assertEquals(2, response.messages().size());
        assertEquals("m1", response.messages().get(0).id());
        assertEquals("m2", response.messages().get(1).id());
        assertFalse(response.hasMore());
    }
}
