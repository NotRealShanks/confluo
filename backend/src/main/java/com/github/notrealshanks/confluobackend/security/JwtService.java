package com.github.notrealshanks.confluobackend.security;

import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.github.notrealshanks.confluobackend.model.User;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

    private final SecretKey key;
    private final long expirationMs;
    private final long guestExpirationMs;

    public JwtService(
            @Value("${jwt.secret}") String base64Secret,
            @Value("${jwt.expiration-ms}") long expirationMs,
            @Value("${jwt.guest-expiration-ms:3600000}") long guestExpirationMs) {
        // Throws WeakKeyException at startup if the secret is under 256 bits
        this.key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(base64Secret));
        this.expirationMs = expirationMs;
        this.guestExpirationMs = guestExpirationMs;
    }

    public String generateToken(User user) {
        return Jwts.builder()
                .subject(user.getId())
                .claim("email", user.getEmail())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(key)
                .compact();
    }

    public String generateGuestToken(String guestId, String projectId, String shareLinkId) {
        Date now = new Date();
        return Jwts.builder()
                .subject(guestId)
                .claim("kind", "guest")
                .claim("projectId", projectId)
                .claim("shareLinkId", shareLinkId)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + guestExpirationMs))
                .signWith(key)
                .compact();
    }

    public TokenClaims parseToken(String token) {
        if (token == null || token.isBlank()) {
            return null;
        }
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            String kind = claims.get("kind", String.class);
            String subject = claims.getSubject();
            if (subject == null || subject.isBlank()) {
                return null;
            }
            if ("guest".equals(kind)) {
                String projectId = claims.get("projectId", String.class);
                String shareLinkId = claims.get("shareLinkId", String.class);
                return projectId == null || projectId.isBlank()
                        || shareLinkId == null || shareLinkId.isBlank()
                        ? null
                        : new TokenClaims(subject, true, projectId, shareLinkId);
            }
            return new TokenClaims(subject, false, null, null);
        } catch (JwtException | IllegalArgumentException e) {
            return null;
        }
    }

    public record TokenClaims(String subject, boolean guest, String projectId, String shareLinkId) {
    }

    // Kept for callers that only need registered-user extraction.
    public String extractUserId(String token) {
        TokenClaims claims = parseToken(token);
        return claims == null || claims.guest() ? null : claims.subject();
    }
}