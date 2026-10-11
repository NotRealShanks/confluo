package com.github.notrealshanks.confluobackend.service;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.github.notrealshanks.confluobackend.dto.CreateDocumentRequest;
import com.github.notrealshanks.confluobackend.dto.DocumentResponse;
import com.github.notrealshanks.confluobackend.model.DocumentMember;
import com.github.notrealshanks.confluobackend.model.EditorDocument;
import com.github.notrealshanks.confluobackend.model.Role;
import com.github.notrealshanks.confluobackend.repository.EditorDocumentRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DocumentService {

    public record Access(EditorDocument document, Role role) {
    }

    private final EditorDocumentRepository documentRepository;

    public DocumentResponse create(String userId, CreateDocumentRequest request) {
        Instant now = Instant.now();
        EditorDocument document = new EditorDocument();
        document.setTitle(request.title().trim());
        document.getMembers().add(new DocumentMember(userId, Role.OWNER));
        document.setCreatedAt(now);
        document.setUpdatedAt(now);
        return toResponse(documentRepository.save(document), Role.OWNER);
    }

    public List<DocumentResponse> listFor(String userId) {
        return documentRepository.findByMembersUserId(userId).stream()
                .flatMap(doc -> doc.roleOf(userId).map(role -> toResponse(doc, role)).stream())
                .sorted(Comparator.comparing(DocumentResponse::updatedAt).reversed())
                .toList();
    }

    public DocumentResponse get(String userId, String documentId) {
        Access access = requireAccess(userId, documentId);
        return toResponse(access.document(), access.role());
    }

    // Shared by every document endpoint; non-members get 404 so IDs can't be probed
    public Access requireAccess(String userId, String documentId) {
        return documentRepository.findById(documentId)
                .flatMap(doc -> doc.roleOf(userId).map(role -> new Access(doc, role)))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found"));
    }

    private static DocumentResponse toResponse(EditorDocument doc, Role role) {
        return new DocumentResponse(doc.getId(), doc.getTitle(), role, doc.getCreatedAt(), doc.getUpdatedAt());
    }
}