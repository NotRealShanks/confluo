package com.github.notrealshanks.confluobackend.controller;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.github.notrealshanks.confluobackend.dto.LiveblocksAuthRequest;
import com.github.notrealshanks.confluobackend.dto.LiveblocksTokenResponse;
import com.github.notrealshanks.confluobackend.service.LiveblocksAuthService;
import com.github.notrealshanks.confluobackend.security.GuestPrincipal;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/liveblocks")
@RequiredArgsConstructor
public class LiveblocksController {

    private final LiveblocksAuthService liveblocksAuthService;

    @PostMapping("/auth")
    public LiveblocksTokenResponse auth(
            Authentication authentication, @Valid @RequestBody LiveblocksAuthRequest request) {
        if (authentication.getPrincipal() instanceof GuestPrincipal guest) {
            return liveblocksAuthService.authorizeGuest(guest, request.room());
        }
        return liveblocksAuthService.authorize(authentication.getName(), request.room());
    }
}