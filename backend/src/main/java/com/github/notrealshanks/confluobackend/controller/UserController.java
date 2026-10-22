package com.github.notrealshanks.confluobackend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.github.notrealshanks.confluobackend.dto.UserResponse;
import com.github.notrealshanks.confluobackend.dto.ProfileUpdateRequest;
import com.github.notrealshanks.confluobackend.service.UserService;
import com.github.notrealshanks.confluobackend.security.GuestPrincipal;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public UserResponse me(Authentication authentication) {
        if (authentication.getPrincipal() instanceof GuestPrincipal) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Guest access is read-only");
        }
        // The filter sets the user id as the principal name.
        return userService.current(authentication.getName());
    }

    @PatchMapping("/me")
    public UserResponse updateProfile(Authentication authentication, @jakarta.validation.Valid @RequestBody ProfileUpdateRequest request) {
        if (authentication.getPrincipal() instanceof GuestPrincipal) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Guest access is read-only");
        }
        return userService.updateProfile(authentication.getName(), request);
    }
}
