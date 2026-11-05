package com.github.notrealshanks.confluobackend.service;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

import com.github.notrealshanks.confluobackend.dto.LiveblocksTokenResponse;
import com.github.notrealshanks.confluobackend.model.Role;
import com.github.notrealshanks.confluobackend.model.User;
import com.github.notrealshanks.confluobackend.repository.UserRepository;
import com.github.notrealshanks.confluobackend.security.GuestPrincipal;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class LiveblocksAuthService {

    private final ProjectService projectService;
    private final UserRepository userRepository;
    private final RestClient restClient;

    public LiveblocksAuthService(
            ProjectService projectService,
            UserRepository userRepository,
            @Value("${liveblocks.secret-key}") String secretKey) {
        this.projectService = projectService;
        this.userRepository = userRepository;

        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(
                HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build());
        factory.setReadTimeout(Duration.ofSeconds(5));
        this.restClient = RestClient.builder()
                .baseUrl("https://api.liveblocks.io")
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + secretKey)
                .requestFactory(factory)
                .build();
    }

    public static String displayName(User user) {
        if (user == null) return "Collaborator";
        String name = user.getName();

        boolean unusable = name == null
                || name.isBlank()
                || name.trim().equalsIgnoreCase(user.getEmail());

        return unusable ? "Collaborator" : name.trim();
    }

    public LiveblocksTokenResponse authorize(String userId, String room) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User no longer exists"));

        // userInfo is visible to other room members, so never expose email as a fallback.
        Map<String, Object> userInfo = new LinkedHashMap<>();
        userInfo.put("name", displayName(user));

        String avatar = user.getAvatarUrl();
        if (avatar != null && !avatar.isBlank()) {
            userInfo.put("avatar", avatar);
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("userId", userId);
        body.put("userInfo", userInfo);

        if (room != null && !room.isBlank()) {
            // The room must be a project the caller belongs to
            Role role = projectService.requireAccess(userId, room).role();
            body.put("permissions", Map.of(room, permissionsFor(role)));
        } else {
            body.put("permissions", Collections.emptyMap());
        }

        return requestToken(body);
    }

    public void revokeRoomAccess(String room, String userId) {
        try {
            Map<String, Object> body = Map.of(
                    "usersAccesses", Collections.singletonMap(userId, null));
            restClient.post()
                    .uri("/v2/rooms/{roomId}", room)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .toBodilessEntity();
            log.info("Revoked Liveblocks room access for user {} in room {}", userId, room);
        } catch (Exception e) {
            log.warn("Failed to revoke Liveblocks room access for user {} in room {}: {}",
                    userId, room, e.getMessage());
        }
    }

    public void triggerInboxNotification(
            String targetUserId,
            String kind,
            String subjectId,
            Map<String, Object> activityData) {
        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("userId", targetUserId);
            payload.put("kind", kind);
            if (subjectId != null && !subjectId.isBlank()) {
                payload.put("subjectId", subjectId);
            }
            payload.put("activityData", activityData);

            restClient.post()
                    .uri("/v2/inbox-notifications/trigger")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .toBodilessEntity();
            log.info("Triggered Liveblocks inbox notification [{}] for user {} (subjectId: {})", kind, targetUserId, subjectId);
        } catch (Exception e) {
            log.warn("Failed to trigger Liveblocks inbox notification [{}] for user {}: {}", kind, targetUserId, e.getMessage());
        }
    }

    public void notifyProjectInvited(String targetUserId, String inviterUserId, String projectId, String projectName, Role role) {
        String actorName = userRepository.findById(inviterUserId)
                .map(LiveblocksAuthService::displayName)
                .orElse("A project owner");

        String roleName = role != null ? role.name() : "EDITOR";
        Map<String, Object> activityData = Map.of(
                "projectId", projectId,
                "projectName", projectName != null ? projectName : "Untitled Project",
                "role", roleName,
                "actorUserId", inviterUserId,
                "actorName", actorName,
                "message", actorName + " invited you to collaborate on " + projectName + " as " + roleName
        );

        triggerInboxNotification(targetUserId, "$project-invited", projectId, activityData);
    }

    public void notifyProjectRoleChanged(String targetUserId, String actorUserId, String projectId, String projectName, Role newRole) {
        String actorName = userRepository.findById(actorUserId)
                .map(LiveblocksAuthService::displayName)
                .orElse("Project owner");

        String roleName = newRole != null ? newRole.name() : "EDITOR";
        Map<String, Object> activityData = Map.of(
                "projectId", projectId,
                "projectName", projectName != null ? projectName : "Untitled Project",
                "role", roleName,
                "actorUserId", actorUserId,
                "actorName", actorName,
                "message", actorName + " updated your role in " + projectName + " to " + roleName
        );

        triggerInboxNotification(targetUserId, "$project-role-changed", projectId, activityData);
    }

    public void notifyOwnershipTransferred(String newOwnerUserId, String previousOwnerUserId, String projectId, String projectName) {
        String actorName = userRepository.findById(previousOwnerUserId)
                .map(LiveblocksAuthService::displayName)
                .orElse("Previous owner");

        Map<String, Object> activityData = Map.of(
                "projectId", projectId,
                "projectName", projectName != null ? projectName : "Untitled Project",
                "role", "OWNER",
                "actorUserId", previousOwnerUserId,
                "actorName", actorName,
                "message", actorName + " transferred ownership of " + projectName + " to you"
        );

        triggerInboxNotification(newOwnerUserId, "$project-ownership-transferred", projectId, activityData);
    }

    public void notifyMemberRemoved(String removedUserId, String actorUserId, String projectId, String projectName) {
        String actorName = userRepository.findById(actorUserId)
                .map(LiveblocksAuthService::displayName)
                .orElse("Project owner");

        Map<String, Object> activityData = Map.of(
                "projectId", projectId,
                "projectName", projectName != null ? projectName : "Untitled Project",
                "actorUserId", actorUserId,
                "actorName", actorName,
                "message", actorName + " removed you from " + projectName
        );

        triggerInboxNotification(removedUserId, "$project-member-removed", projectId, activityData);
    }

    public LiveblocksTokenResponse authorizeGuest(GuestPrincipal guest, String room) {
        if (!guest.projectId().equals(room)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found");
        }
        return authorizeWithLiveblocks("guest:" + guest.guestId(), "Guest viewer", null, room, Role.VIEWER);
    }

    private LiveblocksTokenResponse authorizeWithLiveblocks(
            String userId, String name, String avatar, String room, Role role) {
        Map<String, Object> userInfo = new LinkedHashMap<>();
        userInfo.put("name", name);
        if (avatar != null && !avatar.isBlank()) userInfo.put("avatar", avatar);
        Map<String, Object> body = Map.of(
                "userId", userId,
                "userInfo", userInfo,
                "permissions", Map.of(room, permissionsFor(role)));
        return requestToken(body);
    }

    private LiveblocksTokenResponse requestToken(Map<String, Object> body) {
        Map<String, Object> response;
        try {
            response = restClient.post()
                    .uri("/v2/authorize-user")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (RestClientResponseException e) {
            log.warn("Liveblocks authorize-user failed with status {}", e.getStatusCode().value());
            throw badGateway();
        } catch (RestClientException e) {
            log.warn("Liveblocks authorize-user failed: {}", e.getClass().getSimpleName());
            throw badGateway();
        }
        Object token = response == null ? null : response.get("token");
        if (!(token instanceof String value) || value.isBlank()) throw badGateway();
        return new LiveblocksTokenResponse(value);
    }

    private static List<String> permissionsFor(Role role) {
        return role.canEdit() ? List.of("*:write") : List.of("*:read");
    }

    private static ResponseStatusException badGateway() {
        return new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Could not authorize with Liveblocks");
    }
}
