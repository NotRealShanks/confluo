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
import org.springframework.web.bind.annotation.RestController;

import com.github.notrealshanks.confluobackend.dto.CreateShareLinkRequest;
import com.github.notrealshanks.confluobackend.dto.GuestExchangeRequest;
import com.github.notrealshanks.confluobackend.dto.GuestSessionResponse;
import com.github.notrealshanks.confluobackend.dto.ShareLinkResponse;
import com.github.notrealshanks.confluobackend.service.ShareLinkService;
import com.github.notrealshanks.confluobackend.security.GuestPrincipal;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class ShareLinkController {

    private final ShareLinkService shareLinkService;

    @PostMapping("/api/share-links/exchange")
    public GuestSessionResponse exchange(
            @Valid @RequestBody GuestExchangeRequest request,
            HttpServletRequest httpRequest) {
        return shareLinkService.exchange(request.token(), httpRequest);
    }

    @PostMapping("/api/projects/{projectId}/share-links")
    public ResponseEntity<ShareLinkResponse> create(
            Authentication authentication,
            @PathVariable String projectId,
            @Valid @RequestBody CreateShareLinkRequest request) {
        rejectGuest(authentication);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                shareLinkService.create(authentication.getName(), projectId, request));
    }

    @GetMapping("/api/projects/{projectId}/share-links")
    public List<ShareLinkResponse> list(Authentication authentication, @PathVariable String projectId) {
        rejectGuest(authentication);
        return shareLinkService.list(authentication.getName(), projectId);
    }

    @DeleteMapping("/api/projects/{projectId}/share-links/{linkId}")
    public ResponseEntity<Void> revoke(
            Authentication authentication,
            @PathVariable String projectId,
            @PathVariable String linkId) {
        rejectGuest(authentication);
        shareLinkService.revoke(authentication.getName(), projectId, linkId);
        return ResponseEntity.noContent().build();
    }

    private static void rejectGuest(Authentication authentication) {
        if (authentication.getPrincipal() instanceof GuestPrincipal) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Guest access is read-only");
        }
    }
}
