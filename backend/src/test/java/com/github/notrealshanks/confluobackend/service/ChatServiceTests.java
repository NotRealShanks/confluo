package com.github.notrealshanks.confluobackend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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
    private ChatService chatService;

    @BeforeEach
    void setUp() {
        projectService = mock(ProjectService.class);
        chatMessageRepository = mock(ChatMessageRepository.class);
        userRepository = mock(UserRepository.class);
        chatService = new ChatService(projectService, chatMessageRepository, userRepository);
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
    void oversizedMessageIsRejected() {
        Project project = new Project();
        project.setId("proj-1");
        when(projectService.requireAccess("user-1", "proj-1"))
                .thenReturn(new ProjectService.Access(project, Role.OWNER));

        String oversized = "a".repeat(2001);
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> chatService.sendMessage("user-1", "proj-1", new ChatMessageRequest(oversized)));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertEquals("Message cannot exceed 2000 characters", ex.getReason());
    }

    @Test
    void nonMemberCannotAccessOrSendMessages() {
        when(projectService.requireAccess("outsider", "proj-1"))
                .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));

        ResponseStatusException sendEx = assertThrows(ResponseStatusException.class,
                () -> chatService.sendMessage("outsider", "proj-1", new ChatMessageRequest("Hi")));
        assertEquals(HttpStatus.NOT_FOUND, sendEx.getStatusCode());

        ResponseStatusException listEx = assertThrows(ResponseStatusException.class,
                () -> chatService.listMessages("outsider", "proj-1", 0, 50));
        assertEquals(HttpStatus.NOT_FOUND, listEx.getStatusCode());
    }

    @Test
    void removedMemberCannotAccessChat() {
        // When member is removed, projectService.requireAccess throws 404
        when(projectService.requireAccess("removed-user", "proj-1"))
                .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> chatService.listMessages("removed-user", "proj-1", 0, 50));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }

    @Test
    void listMessagesReturnsChronologicalOrderAndPaginationMetadata() {
        Project project = new Project();
        project.setId("proj-1");
        when(projectService.requireAccess("user-1", "proj-1"))
                .thenReturn(new ProjectService.Access(project, Role.VIEWER));

        Instant t1 = Instant.parse("2026-10-31T10:00:00Z");
        Instant t2 = Instant.parse("2026-10-31T10:05:00Z");

        ChatMessage m1 = ChatMessage.builder().id("1").projectId("proj-1").senderUserId("u1").message("First").createdAt(t1).build();
        ChatMessage m2 = ChatMessage.builder().id("2").projectId("proj-1").senderUserId("u2").message("Second").createdAt(t2).build();

        // Repository returns desc order (newest first: m2, m1)
        Pageable pageable = PageRequest.of(0, 50);
        when(chatMessageRepository.findByProjectIdOrderByCreatedAtDesc("proj-1", pageable))
                .thenReturn(new PageImpl<>(List.of(m2, m1), pageable, 2));

        ChatMessagePageResponse response = chatService.listMessages("user-1", "proj-1", 0, 50);

        assertEquals(2, response.messages().size());
        // Reversal ensures chronological order for display: First (t1), then Second (t2)
        assertEquals("First", response.messages().get(0).message());
        assertEquals("Second", response.messages().get(1).message());
        assertEquals(0, response.page());
        assertEquals(50, response.size());
        assertEquals(2, response.totalElements());
        assertFalse(response.hasMore());
    }

    @Test
    void getMessageChecksProjectIsolation() {
        Project project = new Project();
        project.setId("proj-1");
        when(projectService.requireAccess("user-1", "proj-1"))
                .thenReturn(new ProjectService.Access(project, Role.VIEWER));

        ChatMessage msg = ChatMessage.builder().id("msg-1").projectId("proj-1").senderUserId("u1").message("Isolated").createdAt(Instant.now()).build();
        when(chatMessageRepository.findByIdAndProjectId("msg-1", "proj-1")).thenReturn(Optional.of(msg));

        ChatMessageResponse response = chatService.getMessage("user-1", "proj-1", "msg-1");
        assertEquals("msg-1", response.id());
        assertEquals("Isolated", response.message());

        // Message belonging to another project returns 404
        when(chatMessageRepository.findByIdAndProjectId("other-msg", "proj-1")).thenReturn(Optional.empty());
        assertThrows(ResponseStatusException.class, () -> chatService.getMessage("user-1", "proj-1", "other-msg"));
    }
}

