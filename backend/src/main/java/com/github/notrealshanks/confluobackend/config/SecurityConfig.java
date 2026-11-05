package com.github.notrealshanks.confluobackend.config;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.github.notrealshanks.confluobackend.repository.ShareLinkRepository;
import com.github.notrealshanks.confluobackend.security.GitHubUserService;
import com.github.notrealshanks.confluobackend.security.JwtAuthFilter;
import com.github.notrealshanks.confluobackend.security.JwtService;
import com.github.notrealshanks.confluobackend.security.OAuth2LoginHandler;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtService jwtService,
            ShareLinkRepository shareLinkRepository,
            OAuth2LoginHandler oauthHandler,
            GitHubUserService gitHubUserService) throws Exception {
        http
                // Stateless bearer-token API: no cookies, so no CSRF surface
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // Default with no login mechanism is 403; return 401 for missing credentials
                .exceptionHandling(e -> e.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**", "/api/share-links/exchange", "/error").permitAll()
                        .anyRequest().authenticated())
                .oauth2Login(oauth -> oauth
                        // Google is OIDC and bypasses this; it only serves plain OAuth2 providers like GitHub
                        .userInfoEndpoint(info -> info.userService(gitHubUserService))
                        .successHandler(oauthHandler)
                        .failureHandler(oauthHandler))
                .addFilterBefore(new JwtAuthFilter(jwtService, shareLinkRepository), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource(
            @Value("${app.frontend-url:http://localhost:5173}") String frontendUrl) {
        CorsConfiguration config = new CorsConfiguration();
        List<String> origins = new ArrayList<>();
        for (String url : frontendUrl.split("\\s*,\\s*")) {
            if (!url.isBlank()) {
                origins.add(url.trim().replaceAll("^\"|\"$", "").replaceAll("/+$", ""));
            }
        }
        if (!origins.contains("http://localhost:5173")) origins.add("http://localhost:5173");
        if (!origins.contains("http://127.0.0.1:5173")) origins.add("http://127.0.0.1:5173");

        config.setAllowedOriginPatterns(origins.contains("*") ? List.of("*") : origins);
        config.setAllowCredentials(true);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of(
                "Authorization",
                "Content-Type",
                "X-XSRF-TOKEN",
                "X-CSRF-TOKEN",
                "X-Requested-With",
                "Accept"
        ));
        config.setExposedHeaders(List.of(
                "Authorization",
                "X-XSRF-TOKEN",
                "X-CSRF-TOKEN"
        ));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
