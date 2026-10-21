package com.github.notrealshanks.confluobackend.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.github.notrealshanks.confluobackend.dto.CreateShareLinkRequest;
import com.github.notrealshanks.confluobackend.dto.GuestSessionResponse;
import com.github.notrealshanks.confluobackend.dto.ProjectResponse;
import com.github.notrealshanks.confluobackend.dto.ShareLinkResponse;
import com.github.notrealshanks.confluobackend.model.Project;
import com.github.notrealshanks.confluobackend.model.Role;
import com.github.notrealshanks.confluobackend.model.ShareLink;
import com.github.notrealshanks.confluobackend.repository.ShareLinkRepository;
import com.github.notrealshanks.confluobackend.security.JwtService;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ShareLinkService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final ShareLinkRepository shareLinkRepository;
    private final ProjectService projectService;
    private final JwtService jwtService;
    private final RateLimitService rateLimitService;

    public ShareLinkResponse create(String callerId, String projectId, CreateShareLinkRequest request) {
        requireOwner(callerId, projectId);
        rateLimitService.check("share-create:" + callerId);

        for (int attempt = 0; attempt < 3; attempt++) {
            String rawToken = randomToken();
            ShareLink link = new ShareLink();
            link.setId(UUID.randomUUID().toString());
            link.setProjectId(projectId);
            link.setTokenHash(hash(rawToken));
            link.setCreatedAt(Instant.now());
            link.setExpiresAt(request.expiresAt());
            try {
                ShareLink saved = shareLinkRepository.save(link);
                return toResponse(saved, rawToken);
            } catch (DuplicateKeyException e) {
                // A cryptographic collision is exceptionally unlikely; retry without exposing token material.
            }
        }
        throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not create share link");
    }

    public List<ShareLinkResponse> list(String callerId, String projectId) {
        requireOwner(callerId, projectId);
        return shareLinkRepository.findByProjectIdOrderByCreatedAtDesc(projectId).stream()
                .map(link -> toResponse(link, null))
                .toList();
    }

    public void revoke(String callerId, String projectId, String linkId) {
        requireOwner(callerId, projectId);
        rateLimitService.check("share-revoke:" + callerId);
        ShareLink link = shareLinkRepository.findById(linkId)
                .filter(item -> projectId.equals(item.getProjectId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Share link not found"));
        if (link.getRevokedAt() == null) {
            link.setRevokedAt(Instant.now());
            shareLinkRepository.save(link);
        }
    }

    public GuestSessionResponse exchange(String rawToken, HttpServletRequest request) {
        // Use the socket peer address. Forwarded headers are caller-controlled unless
        // proxy trust is explicitly configured by the deployment.
        String clientKey = request.getRemoteAddr() == null ? "unknown" : request.getRemoteAddr();
        rateLimitService.check("guest-exchange-ip:" + clientKey);
        String tokenHash = hash(rawToken);
        rateLimitService.check("guest-exchange-token:" + tokenHash);

        ShareLink link = shareLinkRepository.findByTokenHash(tokenHash)
                .orElseThrow(this::invalidLink);
        if (!link.isActive(Instant.now())) {
            throw invalidLink();
        }
        Project project = projectService.requireProject(link.getProjectId());
        String guestId = UUID.randomUUID().toString();
        return new GuestSessionResponse(
                jwtService.generateGuestToken(guestId, project.getId(), link.getId()),
                new ProjectResponse(project.getId(), project.getTitle(), Role.VIEWER,
                        project.getCreatedAt(), project.getUpdatedAt()));
    }

    private Project requireOwner(String callerId, String projectId) {
        ProjectService.Access access = projectService.requireAccess(callerId, projectId);
        if (access.role() != Role.OWNER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the owner can manage share links");
        }
        return access.project();
    }

    private static ShareLinkResponse toResponse(ShareLink link, String token) {
        Instant now = Instant.now();
        String status = link.getRevokedAt() != null ? "REVOKED"
                : link.getExpiresAt() != null && !link.getExpiresAt().isAfter(now) ? "EXPIRED" : "ACTIVE";
        return new ShareLinkResponse(link.getId(), link.getProjectId(), link.getCreatedAt(),
                link.getExpiresAt(), link.getRevokedAt(), status, token);
    }

    private static String randomToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String hash(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is unavailable", e);
        }
    }

    private ResponseStatusException invalidLink() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Share link is invalid or unavailable");
    }
}
