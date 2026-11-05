package com.github.notrealshanks.confluobackend.service;

import static org.junit.jupiter.api.Assertions.*;

import java.util.*;
import java.util.function.Function;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Example;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.repository.query.FluentQuery;

import com.github.notrealshanks.confluobackend.dto.RecoveryDraftResponse;
import com.github.notrealshanks.confluobackend.model.Project;
import com.github.notrealshanks.confluobackend.model.RecoveryDraft;
import com.github.notrealshanks.confluobackend.model.Role;
import com.github.notrealshanks.confluobackend.repository.ProjectActivityRepository;
import com.github.notrealshanks.confluobackend.repository.ProjectRepository;
import com.github.notrealshanks.confluobackend.repository.RecoveryDraftRepository;

class RecoveryDraftServiceTests {

    private FakeRecoveryDraftRepository draftRepository;
    private RecoveryDraftService draftService;

    @BeforeEach
    void setUp() {
        draftRepository = new FakeRecoveryDraftRepository();
        ProjectService dummyProjectService = new ProjectService(null, null, null) {
            @Override
            public Access requireAccess(String userId, String projectId) {
                return new Access(new Project(), Role.EDITOR);
            }
        };
        draftService = new RecoveryDraftService(draftRepository, dummyProjectService);
    }

    @Test
    void saveDraft_UpsertsAndRetrieves() {
        RecoveryDraftResponse response = draftService.saveDraft("user-1", "proj-1", "src/App.tsx", "const x = 10;");

        assertNotNull(response);
        assertEquals("src/App.tsx", response.fileId());
        assertEquals("const x = 10;", response.content());
        assertNotNull(response.updatedAt());

        // Update same draft
        RecoveryDraftResponse updated = draftService.saveDraft("user-1", "proj-1", "src/App.tsx", "const x = 20;");
        assertEquals("const x = 20;", updated.content());
        assertEquals(1, draftRepository.drafts.size());

        // Retrieve
        Optional<RecoveryDraftResponse> fetched = draftService.getDraft("user-1", "proj-1", "src/App.tsx");
        assertTrue(fetched.isPresent());
        assertEquals("const x = 20;", fetched.get().content());
    }

    @Test
    void deleteDraft_RemovesEntry() {
        draftService.saveDraft("user-1", "proj-1", "test.js", "console.log('hi');");
        assertEquals(1, draftRepository.drafts.size());

        draftService.deleteDraft("user-1", "proj-1", "test.js");
        assertEquals(0, draftRepository.drafts.size());
    }

    static class FakeRecoveryDraftRepository implements RecoveryDraftRepository {
        final Map<String, RecoveryDraft> drafts = new HashMap<>();

        @Override
        public Optional<RecoveryDraft> findByUserIdAndProjectIdAndFileId(String userId, String projectId, String fileId) {
            return drafts.values().stream()
                    .filter(d -> userId.equals(d.getUserId()) && projectId.equals(d.getProjectId()) && fileId.equals(d.getFileId()))
                    .findFirst();
        }

        @Override
        public List<RecoveryDraft> findAllByUserIdAndProjectId(String userId, String projectId) {
            return drafts.values().stream()
                    .filter(d -> userId.equals(d.getUserId()) && projectId.equals(d.getProjectId()))
                    .toList();
        }

        @Override
        public void deleteByUserIdAndProjectIdAndFileId(String userId, String projectId, String fileId) {
            drafts.values().removeIf(d -> userId.equals(d.getUserId()) && projectId.equals(d.getProjectId()) && fileId.equals(d.getFileId()));
        }

        @Override
        public <S extends RecoveryDraft> S save(S entity) {
            if (entity.getId() == null) entity.setId(UUID.randomUUID().toString());
            drafts.put(entity.getId(), entity);
            return entity;
        }

        @Override public <S extends RecoveryDraft> List<S> saveAll(Iterable<S> entities) { return List.of(); }
        @Override public Optional<RecoveryDraft> findById(String s) { return Optional.ofNullable(drafts.get(s)); }
        @Override public boolean existsById(String s) { return drafts.containsKey(s); }
        @Override public List<RecoveryDraft> findAll() { return new ArrayList<>(drafts.values()); }
        @Override public List<RecoveryDraft> findAllById(Iterable<String> strings) { return List.of(); }
        @Override public long count() { return drafts.size(); }
        @Override public void deleteById(String s) { drafts.remove(s); }
        @Override public void delete(RecoveryDraft entity) { drafts.remove(entity.getId()); }
        @Override public void deleteAllById(Iterable<? extends String> strings) {}
        @Override public void deleteAll(Iterable<? extends RecoveryDraft> entities) {}
        @Override public void deleteAll() { drafts.clear(); }
        @Override public List<RecoveryDraft> findAll(Sort sort) { return List.of(); }
        @Override public Page<RecoveryDraft> findAll(Pageable pageable) { return null; }
        @Override public <S extends RecoveryDraft> S insert(S entity) { return save(entity); }
        @Override public <S extends RecoveryDraft> List<S> insert(Iterable<S> entities) { return List.of(); }
        @Override public <S extends RecoveryDraft> Optional<S> findOne(Example<S> example) { return Optional.empty(); }
        @Override public <S extends RecoveryDraft> List<S> findAll(Example<S> example) { return List.of(); }
        @Override public <S extends RecoveryDraft> List<S> findAll(Example<S> example, Sort sort) { return List.of(); }
        @Override public <S extends RecoveryDraft> Page<S> findAll(Example<S> example, Pageable pageable) { return null; }
        @Override public <S extends RecoveryDraft> long count(Example<S> example) { return 0; }
        @Override public <S extends RecoveryDraft> boolean exists(Example<S> example) { return false; }
        @Override public <S extends RecoveryDraft, R> R findBy(Example<S> example, Function<FluentQuery.FetchableFluentQuery<S>, R> queryFunction) { return null; }
    }
}

