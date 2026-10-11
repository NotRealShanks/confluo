package com.github.notrealshanks.confluobackend.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.github.notrealshanks.confluobackend.dto.AddMemberRequest;
import com.github.notrealshanks.confluobackend.dto.MemberResponse;
import com.github.notrealshanks.confluobackend.model.DocumentMember;
import com.github.notrealshanks.confluobackend.model.EditorDocument;
import com.github.notrealshanks.confluobackend.model.Role;
import com.github.notrealshanks.confluobackend.model.User;
import com.github.notrealshanks.confluobackend.repository.EditorDocumentRepository;
import com.github.notrealshanks.confluobackend.repository.UserRepository;
import com.github.notrealshanks.confluobackend.service.DocumentService.Access;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MemberService {

    private final DocumentService documentService;
    private final EditorDocumentRepository documentRepository;
    private final UserRepository userRepository;

    public List<MemberResponse> list(String callerId, String documentId) {
        EditorDocument doc = requireOwner(callerId, documentId);
        List<String> ids = doc.getMembers().stream().map(DocumentMember::userId).toList();
        Map<String, User> users = userRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
        return doc.getMembers().stream().map(m -> toResponse(m, users.get(m.userId()))).toList();
    }

    public MemberResponse add(String callerId, String documentId, AddMemberRequest request) {
        EditorDocument doc = requireOwner(callerId, documentId);
        requireAssignable(request.role());

        User target = userRepository.findByEmail(request.email().trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No account with that email"));
        if (doc.roleOf(target.getId()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "User already has access");
        }

        DocumentMember member = new DocumentMember(target.getId(), request.role());
        List<DocumentMember> members = new ArrayList<>(doc.getMembers());
        members.add(member);
        saveMembers(doc, members);
        return toResponse(member, target);
    }

    public MemberResponse updateRole(String callerId, String documentId, String targetUserId, Role role) {
        EditorDocument doc = requireOwner(callerId, documentId);
        requireAssignable(role);

        Role current = doc.roleOf(targetUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Member not found"));
        if (current == Role.OWNER) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "The owner's role can't be changed");
        }

        DocumentMember updated = new DocumentMember(targetUserId, role);
        List<DocumentMember> members = doc.getMembers().stream()
                .map(m -> m.userId().equals(targetUserId) ? updated : m)
                .toList();
        saveMembers(doc, members);
        return toResponse(updated, userRepository.findById(targetUserId).orElse(null));
    }

    public void remove(String callerId, String documentId, String targetUserId) {
        Access access = documentService.requireAccess(callerId, documentId);
        // Owners can remove anyone else; every member can remove themselves
        if (!callerId.equals(targetUserId) && !access.role().canManageMembers()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the owner can remove other members");
        }

        EditorDocument doc = access.document();
        Role target = doc.roleOf(targetUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Member not found"));
        if (target == Role.OWNER) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "The owner can't be removed");
        }

        saveMembers(doc, doc.getMembers().stream().filter(m -> !m.userId().equals(targetUserId)).toList());
    }

    // Non-members get 404 from requireAccess; members without the right role get 403
    private EditorDocument requireOwner(String callerId, String documentId) {
        Access access = documentService.requireAccess(callerId, documentId);
        if (!access.role().canManageMembers()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the owner can manage members");
        }
        return access.document();
    }

    private static void requireAssignable(Role role) {
        if (role == Role.OWNER) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role must be EDITOR or VIEWER");
        }
    }

    private void saveMembers(EditorDocument doc, List<DocumentMember> members) {
        doc.setMembers(new ArrayList<>(members));
        doc.setUpdatedAt(Instant.now());
        documentRepository.save(doc);
    }

    // user is null if the account was deleted after being added
    private static MemberResponse toResponse(DocumentMember member, User user) {
        return new MemberResponse(
                member.userId(),
                user == null ? "Unknown user" : user.getName(),
                user == null ? null : user.getEmail(),
                member.role());
    }
}