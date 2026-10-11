package com.github.notrealshanks.confluobackend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.github.notrealshanks.confluobackend.dto.CreateDocumentRequest;
import com.github.notrealshanks.confluobackend.dto.DocumentResponse;
import com.github.notrealshanks.confluobackend.service.DocumentService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    @PostMapping
    public ResponseEntity<DocumentResponse> create(
            Authentication authentication, @Valid @RequestBody CreateDocumentRequest request) {
        // JwtAuthFilter sets the user id as the principal name
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(documentService.create(authentication.getName(), request));
    }

    @GetMapping
    public List<DocumentResponse> list(Authentication authentication) {
        return documentService.listFor(authentication.getName());
    }

    @GetMapping("/{id}")
    public DocumentResponse get(Authentication authentication, @PathVariable String id) {
        return documentService.get(authentication.getName(), id);
    }
}