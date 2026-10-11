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

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/documents/{documentId}/members")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;

    @GetMapping
    public List<MemberResponse> list(Authentication authentication, @PathVariable String documentId) {
        return memberService.list(authentication.getName(), documentId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MemberResponse add(
            Authentication authentication,
            @PathVariable String documentId,
            @Valid @RequestBody AddMemberRequest request) {
        return memberService.add(authentication.getName(), documentId, request);
    }

    @PatchMapping("/{userId}")
    public MemberResponse updateRole(
            Authentication authentication,
            @PathVariable String documentId,
            @PathVariable String userId,
            @Valid @RequestBody UpdateMemberRoleRequest request) {
        return memberService.updateRole(authentication.getName(), documentId, userId, request.role());
    }

    @DeleteMapping("/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(Authentication authentication, @PathVariable String documentId, @PathVariable String userId) {
        memberService.remove(authentication.getName(), documentId, userId);
    }
}