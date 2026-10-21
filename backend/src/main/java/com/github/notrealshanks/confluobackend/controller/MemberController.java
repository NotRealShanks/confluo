package com.github.notrealshanks.confluobackend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.github.notrealshanks.confluobackend.dto.AddMemberRequest;
import com.github.notrealshanks.confluobackend.dto.MemberResponse;
import com.github.notrealshanks.confluobackend.dto.UpdateMemberRoleRequest;
import com.github.notrealshanks.confluobackend.service.MemberService;
import com.github.notrealshanks.confluobackend.security.GuestPrincipal;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/projects/{projectId}/members")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;

    @GetMapping
    public List<MemberResponse> list(Authentication authentication, @PathVariable String projectId) {
        rejectGuest(authentication);
        return memberService.list(authentication.getName(), projectId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MemberResponse add(
            Authentication authentication,
            @PathVariable String projectId,
            @Valid @RequestBody AddMemberRequest request) {
        rejectGuest(authentication);
        return memberService.add(authentication.getName(), projectId, request);
    }

    @PatchMapping("/{userId}")
    public MemberResponse updateRole(
            Authentication authentication,
            @PathVariable String projectId,
            @PathVariable String userId,
            @Valid @RequestBody UpdateMemberRoleRequest request) {
        rejectGuest(authentication);
        return memberService.updateRole(authentication.getName(), projectId, userId, request.role());
    }

    @DeleteMapping("/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(Authentication authentication, @PathVariable String projectId, @PathVariable String userId) {
        rejectGuest(authentication);
        memberService.remove(authentication.getName(), projectId, userId);
    }

    private static void rejectGuest(Authentication authentication) {
        if (authentication.getPrincipal() instanceof GuestPrincipal) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Guest access is read-only");
        }
    }
}
