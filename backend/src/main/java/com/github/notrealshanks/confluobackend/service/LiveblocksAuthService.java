package com.github.notrealshanks.confluobackend.service;

import java.net.http.HttpClient;
import java.time.Duration;
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

    private static String displayName(User user) {
        String name = user.getName();

        boolean unusable = name == null
                || name.isBlank()
                || name.trim().equalsIgnoreCase(user.getEmail());

        return unusable ? "Anonymous" : name.trim();
    }

    public LiveblocksTokenResponse authorize(String userId, String room) {
        // The room must be a project the caller belongs to, so wildcard room names can't get through
        Role role = projectService.requireAccess(userId, room).role();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User no longer exists"));

        // userInfo is visible to other room members, so never expose email as a fallback.
        Map<String, Object> userInfo = new LinkedHashMap<>();
        userInfo.put("name", displayName(user));

        String avatar = user.getAvatarUrl();
        if (avatar != null && !avatar.isBlank()) {
            userInfo.put("avatar", avatar);
        }

        return requestToken(Map.of(
                "userId", userId,
                "userInfo", userInfo,
                "permissions", Map.of(room, permissionsFor(role))));
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

    // Viewer cursor visibility under "*:read" is unverified; revisit after a browser test
    private static List<String> permissionsFor(Role role) {
        return role.canEdit() ? List.of("*:write") : List.of("*:read");
    }

    private static ResponseStatusException badGateway() {
        return new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Could not authorize with Liveblocks");
    }
}