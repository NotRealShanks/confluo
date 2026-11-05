package com.github.notrealshanks.confluobackend.service;

import static org.junit.jupiter.api.Assertions.*;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.github.notrealshanks.confluobackend.dto.git.GitBranchesResponse;
import com.github.notrealshanks.confluobackend.dto.git.GitCommitDTO;
import com.github.notrealshanks.confluobackend.dto.git.GitStatusResponse;
import com.github.notrealshanks.confluobackend.model.Project;
import com.github.notrealshanks.confluobackend.model.Role;

class GitServiceTests {

    private Path tempBaseDir;
    private GitService gitService;
    private final String testProjectId = "test-proj-123";

    @BeforeEach
    void setUp() throws Exception {
        tempBaseDir = Files.createTempDirectory("confluo-git-test");
        ProjectService dummyProjectService = new ProjectService(null, null, null) {
            @Override
            public Access requireAccess(String userId, String projectId) {
                return new Access(new Project(), Role.OWNER);
            }
        };
        gitService = new GitService(tempBaseDir.toString(), dummyProjectService);
    }

    @AfterEach
    void tearDown() throws Exception {
        if (Files.exists(tempBaseDir)) {
            Files.walk(tempBaseDir)
                    .sorted(Comparator.reverseOrder())
                    .map(Path::toFile)
                    .forEach(File::delete);
        }
    }

    @Test
    void gitLifecycle_Init_Sync_Stage_Commit_Branch_Checkout() {
        // 1. Init
        assertFalse(gitService.isInitialized(testProjectId));
        gitService.init("user-1", testProjectId, "Test Author", "author@confluo.dev");
        assertTrue(gitService.isInitialized(testProjectId));

        // 2. Sync working tree files
        gitService.syncWorkingTree("user-1", testProjectId, Map.of(
                "src/index.ts", "console.log('hello world');",
                "README.md", "# Test Project"
        ));

        // 3. Status - files should be untracked
        GitStatusResponse status = gitService.getStatus("user-1", testProjectId);
        assertTrue(status.initialized());
        assertTrue(status.untracked().contains("src/index.ts") || status.untracked().contains("README.md"));

        // 4. Stage
        gitService.stage("user-1", testProjectId, List.of("src/index.ts", "README.md"));
        GitStatusResponse stagedStatus = gitService.getStatus("user-1", testProjectId);
        assertEquals(2, stagedStatus.staged().size());

        // 5. Commit
        gitService.commit("user-1", testProjectId, "Add starter files", "Test Author", "author@confluo.dev");
        List<GitCommitDTO> log = gitService.getLog("user-1", testProjectId, 10);
        assertTrue(log.size() >= 2); // Initial commit + Add starter files
        assertEquals("Add starter files", log.get(0).message());

        // 6. Branch & Checkout
        gitService.createBranch("user-1", testProjectId, "feature-auth");
        GitBranchesResponse branches = gitService.getBranches("user-1", testProjectId);
        assertTrue(branches.branches().contains("feature-auth"));

        gitService.checkout("user-1", testProjectId, "feature-auth");
        GitBranchesResponse checkedOutBranches = gitService.getBranches("user-1", testProjectId);
        assertEquals("feature-auth", checkedOutBranches.currentBranch());
    }

    @Test
    void gitRemote_SetAndGet() {
        gitService.init("user-1", testProjectId, "Test Author", "author@confluo.dev");
        assertEquals("", gitService.getRemote("user-1", testProjectId).remoteUrl());

        gitService.setRemote("user-1", testProjectId, "https://github.com/testuser/repo.git");
        assertEquals("https://github.com/testuser/repo.git", gitService.getRemote("user-1", testProjectId).remoteUrl());

        gitService.setRemote("user-1", testProjectId, "https://github.com/testuser/updated.git");
        assertEquals("https://github.com/testuser/updated.git", gitService.getRemote("user-1", testProjectId).remoteUrl());
    }
}

