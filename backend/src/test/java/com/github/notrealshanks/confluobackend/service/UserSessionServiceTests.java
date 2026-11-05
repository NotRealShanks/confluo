package com.github.notrealshanks.confluobackend.service;

import static org.junit.jupiter.api.Assertions.*;

import java.time.Instant;
import java.util.*;
import java.util.function.Function;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Example;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.repository.query.FluentQuery;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import com.github.notrealshanks.confluobackend.dto.AuthResponse;
import com.github.notrealshanks.confluobackend.model.SessionStatus;
import com.github.notrealshanks.confluobackend.model.User;
import com.github.notrealshanks.confluobackend.model.UserSession;
import com.github.notrealshanks.confluobackend.repository.UserRepository;
import com.github.notrealshanks.confluobackend.repository.UserSessionRepository;
import com.github.notrealshanks.confluobackend.security.JwtService;

class UserSessionServiceTests {

    private FakeUserSessionRepository userSessionRepository;
    private FakeUserRepository userRepository;
    private JwtService jwtService;
    private SessionSseManager sessionSseManager;
    private UserSessionService userSessionService;
    private User testUser;

    @BeforeEach
    void setUp() {
        userSessionRepository = new FakeUserSessionRepository();
        userRepository = new FakeUserRepository();
        // 256-bit test secret in Base64
        String testSecret = "MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDE=";
        jwtService = new JwtService(testSecret, 900000L, 3600000L);
        sessionSseManager = new SessionSseManager();

        userSessionService = new UserSessionService(
                userSessionRepository,
                userRepository,
                jwtService,
                sessionSseManager,
                1296000000L,
                false,
                "Lax");

        testUser = new User();
        testUser.setId("user-1");
        testUser.setEmail("test@confluo.dev");
        testUser.setName("Test User");
        userRepository.save(testUser);
    }

    @Test
    void issueSession_CreatesSessionAndSetsCookies() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("User-Agent", "Mozilla/5.0 Chrome/130");
        request.setRemoteAddr("127.0.0.1");
        MockHttpServletResponse response = new MockHttpServletResponse();

        AuthResponse authResponse = userSessionService.issueSession(testUser, request, response);

        assertNotNull(authResponse);
        assertNotNull(authResponse.token());
        assertEquals("user-1", authResponse.user().id());

        assertEquals(1, userSessionRepository.sessions.size());
        UserSession session = userSessionRepository.sessions.values().iterator().next();
        assertEquals("user-1", session.getUserId());
        assertEquals(SessionStatus.ACTIVE, session.getStatus());

        List<String> setCookieHeaders = response.getHeaders("Set-Cookie");
        assertTrue(setCookieHeaders.stream().anyMatch(h -> h.contains("refreshToken=")));
        assertTrue(setCookieHeaders.stream().anyMatch(h -> h.contains("XSRF-TOKEN=")));
    }

    @Test
    void rotateSession_Success() {
        MockHttpServletRequest initRequest = new MockHttpServletRequest();
        MockHttpServletResponse initResponse = new MockHttpServletResponse();
        userSessionService.issueSession(testUser, initRequest, initResponse);

        UserSession initialSession = userSessionRepository.sessions.values().iterator().next();
        String rawToken = initialSession.getSelector() + ".dummy";

        // Update verifierHash with known verifier
        BCryptPasswordEncoder hasher = new BCryptPasswordEncoder(12);
        initialSession.setVerifierHash(hasher.encode("known-verifier"));
        userSessionRepository.save(initialSession);

        String validRawToken = initialSession.getSelector() + ".known-verifier";

        MockHttpServletRequest rotateRequest = new MockHttpServletRequest();
        MockHttpServletResponse rotateResponse = new MockHttpServletResponse();

        AuthResponse rotated = userSessionService.rotateSession(
                validRawToken,
                "csrf-test",
                "csrf-test",
                rotateRequest,
                rotateResponse);

        assertNotNull(rotated);
        assertNotNull(rotated.token());

        // Previous session should be SUPERSEDED
        assertEquals(SessionStatus.SUPERSEDED, initialSession.getStatus());
        // A new ACTIVE session exists
        long activeCount = userSessionRepository.sessions.values().stream()
                .filter(s -> s.getStatus() == SessionStatus.ACTIVE)
                .count();
        assertEquals(1, activeCount);
    }

    @Test
    void rotateSession_DetectsReuse_RevokesAllSessions() {
        UserSession compromisedSession = UserSession.builder()
                .id("comp-1")
                .userId("user-1")
                .selector("comp-sel")
                .status(SessionStatus.SUPERSEDED)
                .build();
        userSessionRepository.save(compromisedSession);

        UserSession activeSession = UserSession.builder()
                .id("act-1")
                .userId("user-1")
                .selector("act-sel")
                .status(SessionStatus.ACTIVE)
                .build();
        userSessionRepository.save(activeSession);

        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        assertThrows(ResponseStatusException.class, () ->
                userSessionService.rotateSession(
                        "comp-sel.any-verifier",
                        "csrf-ok",
                        "csrf-ok",
                        request,
                        response));

        assertEquals(SessionStatus.REVOKED, activeSession.getStatus());
    }

    @Test
    void confirmOverride_TerminatesPreviousSessions() {
        UserSession oldSession = UserSession.builder()
                .id("old-1")
                .userId("user-1")
                .selector("old-sel")
                .status(SessionStatus.ACTIVE)
                .build();
        userSessionRepository.save(oldSession);

        String confirmationToken = jwtService.generateSessionOverrideToken("user-1", "test@confluo.dev");

        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        AuthResponse authResponse = userSessionService.confirmOverride(confirmationToken, request, response);

        assertNotNull(authResponse);
        assertEquals(SessionStatus.SUPERSEDED, oldSession.getStatus());
        assertEquals(1, userSessionRepository.findAllByUserIdAndStatus("user-1", SessionStatus.ACTIVE).size());
    }

    @Test
    void listUserSessions_and_revoke() {
        UserSession s1 = UserSession.builder()
                .id("s-1")
                .userId("user-1")
                .selector("sel-1")
                .createdAt(Instant.now().minusSeconds(100))
                .status(SessionStatus.ACTIVE)
                .deviceInfo("Google Chrome")
                .build();
        UserSession s2 = UserSession.builder()
                .id("s-2")
                .userId("user-1")
                .selector("sel-2")
                .createdAt(Instant.now())
                .status(SessionStatus.ACTIVE)
                .deviceInfo("Mozilla Firefox")
                .build();
        userSessionRepository.save(s1);
        userSessionRepository.save(s2);

        var list = userSessionService.listUserSessions("user-1", "sel-2.dummyverifier");
        assertEquals(2, list.size());
        assertTrue(list.get(0).current()); // sel-2 is newer and matches selector
        assertFalse(list.get(1).current());

        userSessionService.revokeSession("user-1", "s-1");
        assertEquals(SessionStatus.REVOKED, s1.getStatus());

        userSessionService.revokeOtherSessions("user-1", "sel-2.dummyverifier");
        assertEquals(SessionStatus.ACTIVE, s2.getStatus());
    }

    // In-memory fake repository for UserSession
    static class FakeUserSessionRepository implements UserSessionRepository {
        final Map<String, UserSession> sessions = new HashMap<>();

        @Override
        public Optional<UserSession> findBySelector(String selector) {
            return sessions.values().stream().filter(s -> selector.equals(s.getSelector())).findFirst();
        }

        @Override
        public List<UserSession> findAllByUserIdAndStatus(String userId, SessionStatus status) {
            return sessions.values().stream()
                    .filter(s -> userId.equals(s.getUserId()) && status.equals(s.getStatus()))
                    .toList();
        }

        @Override
        public List<UserSession> findAllByUserIdOrderByCreatedAtDesc(String userId) {
            return sessions.values().stream()
                    .filter(s -> userId.equals(s.getUserId()))
                    .sorted(Comparator.comparing(UserSession::getCreatedAt).reversed())
                    .toList();
        }

        @Override
        public Optional<UserSession> findFirstByUserIdAndStatusOrderByCreatedAtDesc(String userId, SessionStatus status) {
            return sessions.values().stream()
                    .filter(s -> userId.equals(s.getUserId()) && status.equals(s.getStatus()))
                    .max(Comparator.comparing(UserSession::getCreatedAt));
        }

        @Override
        public void deleteAllByUserId(String userId) {
            sessions.values().removeIf(s -> userId.equals(s.getUserId()));
        }

        @Override
        public <S extends UserSession> S save(S entity) {
            if (entity.getId() == null) {
                entity.setId(UUID.randomUUID().toString());
            }
            sessions.put(entity.getId(), entity);
            return entity;
        }

        @Override public <S extends UserSession> List<S> saveAll(Iterable<S> entities) { return List.of(); }
        @Override public Optional<UserSession> findById(String s) { return Optional.ofNullable(sessions.get(s)); }
        @Override public boolean existsById(String s) { return sessions.containsKey(s); }
        @Override public List<UserSession> findAll() { return new ArrayList<>(sessions.values()); }
        @Override public List<UserSession> findAllById(Iterable<String> strings) { return List.of(); }
        @Override public long count() { return sessions.size(); }
        @Override public void deleteById(String s) { sessions.remove(s); }
        @Override public void delete(UserSession entity) { sessions.remove(entity.getId()); }
        @Override public void deleteAllById(Iterable<? extends String> strings) {}
        @Override public void deleteAll(Iterable<? extends UserSession> entities) {}
        @Override public void deleteAll() { sessions.clear(); }
        @Override public List<UserSession> findAll(Sort sort) { return List.of(); }
        @Override public Page<UserSession> findAll(Pageable pageable) { return null; }
        @Override public <S extends UserSession> S insert(S entity) { return save(entity); }
        @Override public <S extends UserSession> List<S> insert(Iterable<S> entities) { return List.of(); }
        @Override public <S extends UserSession> Optional<S> findOne(Example<S> example) { return Optional.empty(); }
        @Override public <S extends UserSession> List<S> findAll(Example<S> example) { return List.of(); }
        @Override public <S extends UserSession> List<S> findAll(Example<S> example, Sort sort) { return List.of(); }
        @Override public <S extends UserSession> Page<S> findAll(Example<S> example, Pageable pageable) { return null; }
        @Override public <S extends UserSession> long count(Example<S> example) { return 0; }
        @Override public <S extends UserSession> boolean exists(Example<S> example) { return false; }
        @Override public <S extends UserSession, R> R findBy(Example<S> example, Function<FluentQuery.FetchableFluentQuery<S>, R> queryFunction) { return null; }
    }

    // In-memory fake repository for User
    static class FakeUserRepository implements UserRepository {
        final Map<String, User> users = new HashMap<>();

        @Override public Optional<User> findByEmail(String email) {
            return users.values().stream().filter(u -> email.equalsIgnoreCase(u.getEmail())).findFirst();
        }
        @Override public Optional<User> findByProviderAndProviderId(String provider, String providerId) {
            return users.values().stream().filter(u -> provider.equals(u.getProvider()) && providerId.equals(u.getProviderId())).findFirst();
        }
        @Override public <S extends User> S save(S entity) {
            if (entity.getId() == null) entity.setId(UUID.randomUUID().toString());
            users.put(entity.getId(), entity);
            return entity;
        }
        @Override public Optional<User> findById(String id) { return Optional.ofNullable(users.get(id)); }
        @Override public boolean existsById(String s) { return users.containsKey(s); }
        @Override public List<User> findAll() { return new ArrayList<>(users.values()); }
        @Override public List<User> findAllById(Iterable<String> strings) { return List.of(); }
        @Override public long count() { return users.size(); }
        @Override public void deleteById(String s) { users.remove(s); }
        @Override public void delete(User entity) { users.remove(entity.getId()); }
        @Override public void deleteAllById(Iterable<? extends String> strings) {}
        @Override public void deleteAll(Iterable<? extends User> entities) {}
        @Override public void deleteAll() { users.clear(); }
        @Override public <S extends User> List<S> saveAll(Iterable<S> entities) { return List.of(); }
        @Override public List<User> findAll(Sort sort) { return List.of(); }
        @Override public Page<User> findAll(Pageable pageable) { return null; }
        @Override public <S extends User> S insert(S entity) { return save(entity); }
        @Override public <S extends User> List<S> insert(Iterable<S> entities) { return List.of(); }
        @Override public <S extends User> Optional<S> findOne(Example<S> example) { return Optional.empty(); }
        @Override public <S extends User> List<S> findAll(Example<S> example) { return List.of(); }
        @Override public <S extends User> List<S> findAll(Example<S> example, Sort sort) { return List.of(); }
        @Override public <S extends User> Page<S> findAll(Example<S> example, Pageable pageable) { return null; }
        @Override public <S extends User> long count(Example<S> example) { return 0; }
        @Override public <S extends User> boolean exists(Example<S> example) { return false; }
        @Override public <S extends User, R> R findBy(Example<S> example, Function<FluentQuery.FetchableFluentQuery<S>, R> queryFunction) { return null; }
    }
}
