package com.github.notrealshanks.confluobackend.security;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import com.github.notrealshanks.confluobackend.exception.OAuthLoginException;
import com.github.notrealshanks.confluobackend.model.User;
import com.github.notrealshanks.confluobackend.service.OAuthUserService;
import com.github.notrealshanks.confluobackend.service.OAuthUserService.Profile;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class OAuth2LoginHandler implements AuthenticationSuccessHandler, AuthenticationFailureHandler {

    private final OAuthUserService oAuthUserService;
    private final JwtService jwtService;
    private final String frontendUrl;

    public OAuth2LoginHandler(
            OAuthUserService oAuthUserService,
            JwtService jwtService,
            @Value("${app.frontend-url:http://localhost:5173}") String frontendUrl) {
        this.oAuthUserService = oAuthUserService;
        this.jwtService = jwtService;
        this.frontendUrl = frontendUrl;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        invalidateSession(request);

        OAuth2AuthenticationToken token = (OAuth2AuthenticationToken) authentication;
        try {
            Profile profile = toProfile(token.getAuthorizedClientRegistrationId(), token.getPrincipal());
            User user = oAuthUserService.findOrCreate(profile);
            // Fragment keeps the token out of server logs and Referer headers
            response.sendRedirect(frontendUrl + "/oauth/callback#token=" + jwtService.generateToken(user));
        } catch (OAuthLoginException e) {
            response.sendRedirect(frontendUrl + "/login?error=" + e.getCode());
        }
    }

    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response,
                                        AuthenticationException exception) throws IOException {
        invalidateSession(request);
        log.warn("OAuth login failed: {}", exception.getMessage());
        response.sendRedirect(frontendUrl + "/login?error=oauth_failed");
    }

    private Profile toProfile(String registrationId, OAuth2User user) {
        return switch (registrationId) {
            case "google" -> {
                // Typed as Object: the claim is a Boolean, but parse defensively
                Object verified = user.getAttribute("email_verified");
                yield new Profile(
                        "google",
                        user.getAttribute("sub"),
                        user.getAttribute("email"),
                        Boolean.parseBoolean(String.valueOf(verified)),
                        user.getAttribute("name"),
                        user.getAttribute("picture"));
            }
            case "github" -> {
                // GitHub's id is numeric; store it as a string like the other providers
                Object id = user.getAttribute("id");
                String login = user.getAttribute("login");
                String name = user.getAttribute("name");
                String email = user.getAttribute(GitHubUserService.VERIFIED_EMAIL_ATTRIBUTE);
                yield new Profile(
                        "github",
                        id == null ? null : String.valueOf(id),
                        email,
                        email != null,
                        name != null ? name : login,
                        user.getAttribute("avatar_url"));
            }
            default -> throw new OAuthLoginException("unsupported_provider");
        };
    }

    // The OAuth client creates a session for the authorization request even when STATELESS
    private void invalidateSession(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
    }
}