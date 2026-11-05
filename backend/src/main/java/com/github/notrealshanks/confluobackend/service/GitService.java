package com.github.notrealshanks.confluobackend.service;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.github.notrealshanks.confluobackend.dto.git.*;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class GitService {

    private static final Pattern SAFE_NAME = Pattern.compile("^[a-zA-Z0-9_.-]+$");
    private final Path basePath;
    private final ProjectService projectService;

    public GitService(
            @Value("${git.storage.base-path:data/git-storage}") String basePathStr,
            ProjectService projectService) {
        this.basePath = Paths.get(basePathStr).toAbsolutePath().normalize();
        this.projectService = projectService;
        try {
            Files.createDirectories(this.basePath);
        } catch (Exception e) {
            log.warn("Could not create git storage directory {}: {}", this.basePath, e.getMessage());
        }
    }

    private Path getRepoPath(String projectId) {
        if (projectId == null || !SAFE_NAME.matcher(projectId).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid project ID");
        }
        Path path = basePath.resolve(projectId).normalize();
        if (!path.startsWith(basePath)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid path navigation");
        }
        return path;
    }

    public boolean isInitialized(String projectId) {
        Path repo = getRepoPath(projectId);
        return Files.isDirectory(repo.resolve(".git"));
    }

    public void init(String userId, String projectId, String authorName, String authorEmail) {
        projectService.requireAccess(userId, projectId);
        Path repo = getRepoPath(projectId);
        try {
            Files.createDirectories(repo);
            if (!isInitialized(projectId)) {
                runGit(repo, "init", "-b", "main");
                String cleanName = (authorName != null && !authorName.isBlank()) ? authorName.trim() : "Confluo Developer";
                String cleanEmail = (authorEmail != null && !authorEmail.isBlank()) ? authorEmail.trim() : "dev@confluo.local";
                runGit(repo, "config", "user.name", cleanName);
                runGit(repo, "config", "user.email", cleanEmail);

                // Create initial .gitignore
                Path gitignore = repo.resolve(".gitignore");
                if (!Files.exists(gitignore)) {
                    Files.writeString(gitignore, "node_modules/\ntarget/\n.idea/\n*.log\n.DS_Store\n");
                }
                runGit(repo, "add", ".gitignore");
                runGit(repo, "commit", "--allow-empty", "-m", "Initial commit");
            }
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to initialize git repository: " + e.getMessage());
        }
    }

    public GitStatusResponse getStatus(String userId, String projectId) {
        projectService.requireAccess(userId, projectId);
        if (!isInitialized(projectId)) {
            return new GitStatusResponse(false, "", List.of(), List.of(), List.of());
        }
        Path repo = getRepoPath(projectId);
        String branch = runGit(repo, "branch", "--show-current").trim();
        String porcelain = runGit(repo, "status", "--porcelain=v1", "-uall");

        List<GitFileStatus> staged = new ArrayList<>();
        List<GitFileStatus> unstaged = new ArrayList<>();
        List<String> untracked = new ArrayList<>();

        for (String line : porcelain.split("\\r?\\n")) {
            if (line.length() < 3) continue;
            char indexChar = line.charAt(0);
            char workChar = line.charAt(1);
            String filePath = line.substring(3).trim();

            if (indexChar == '?' && workChar == '?') {
                untracked.add(filePath);
            } else {
                if (indexChar != ' ' && indexChar != '?') {
                    staged.add(new GitFileStatus(filePath, String.valueOf(indexChar)));
                }
                if (workChar != ' ' && workChar != '?') {
                    unstaged.add(new GitFileStatus(filePath, String.valueOf(workChar)));
                }
            }
        }

        return new GitStatusResponse(true, branch, staged, unstaged, untracked);
    }

    public void stage(String userId, String projectId, List<String> paths) {
        projectService.requireAccess(userId, projectId);
        Path repo = getRepoPath(projectId);
        if (paths == null || paths.isEmpty() || paths.contains(".")) {
            runGit(repo, "add", "-A");
        } else {
            List<String> args = new ArrayList<>(List.of("add", "--"));
            args.addAll(paths);
            runGit(repo, args.toArray(new String[0]));
        }
    }

    public void unstage(String userId, String projectId, List<String> paths) {
        projectService.requireAccess(userId, projectId);
        Path repo = getRepoPath(projectId);
        if (paths == null || paths.isEmpty() || paths.contains(".")) {
            runGit(repo, "restore", "--staged", ".");
        } else {
            List<String> args = new ArrayList<>(List.of("restore", "--staged", "--"));
            args.addAll(paths);
            runGit(repo, args.toArray(new String[0]));
        }
    }

    public void discard(String userId, String projectId, List<String> paths) {
        projectService.requireAccess(userId, projectId);
        Path repo = getRepoPath(projectId);
        if (paths == null || paths.isEmpty() || paths.contains(".")) {
            runGit(repo, "restore", ".");
            runGit(repo, "clean", "-fd");
        } else {
            List<String> argsRestore = new ArrayList<>(List.of("restore", "--"));
            argsRestore.addAll(paths);
            runGit(repo, argsRestore.toArray(new String[0]));

            List<String> argsClean = new ArrayList<>(List.of("clean", "-fd", "--"));
            argsClean.addAll(paths);
            runGit(repo, argsClean.toArray(new String[0]));
        }
    }

    public void commit(String userId, String projectId, String message, String authorName, String authorEmail) {
        projectService.requireAccess(userId, projectId);
        Path repo = getRepoPath(projectId);
        String cleanName = (authorName != null && !authorName.isBlank()) ? authorName.trim() : "Developer";
        String cleanEmail = (authorEmail != null && !authorEmail.isBlank()) ? authorEmail.trim() : "dev@confluo.local";
        String author = String.format("%s <%s>", cleanName, cleanEmail);

        runGit(repo, "commit", "-m", message, "--author=" + author);
    }

    public List<GitCommitDTO> getLog(String userId, String projectId, int limit) {
        projectService.requireAccess(userId, projectId);
        if (!isInitialized(projectId)) {
            return List.of();
        }
        Path repo = getRepoPath(projectId);
        String output = runGit(repo, "log", "-n", String.valueOf(Math.max(1, Math.min(limit, 100))), "--pretty=format:%H%x09%an%x09%ae%x09%aI%x09%s");
        List<GitCommitDTO> commits = new ArrayList<>();

        for (String line : output.split("\\r?\\n")) {
            if (line.isBlank()) continue;
            String[] parts = line.split("\\t", 5);
            if (parts.length >= 5) {
                commits.add(new GitCommitDTO(parts[0], parts[1], parts[2], parts[3], parts[4]));
            }
        }
        return commits;
    }

    public String getDiff(String userId, String projectId, String filePath, boolean staged) {
        projectService.requireAccess(userId, projectId);
        Path repo = getRepoPath(projectId);
        if (staged) {
            return runGit(repo, "diff", "--staged", "--", filePath);
        } else {
            return runGit(repo, "diff", "--", filePath);
        }
    }

    public GitBranchesResponse getBranches(String userId, String projectId) {
        projectService.requireAccess(userId, projectId);
        if (!isInitialized(projectId)) {
            return new GitBranchesResponse("", List.of());
        }
        Path repo = getRepoPath(projectId);
        String current = runGit(repo, "branch", "--show-current").trim();
        String output = runGit(repo, "branch", "--list");

        List<String> branches = new ArrayList<>();
        for (String line : output.split("\\r?\\n")) {
            String name = line.replace("*", "").trim();
            if (!name.isBlank()) {
                branches.add(name);
            }
        }
        return new GitBranchesResponse(current, branches);
    }

    public GitRemoteResponse getRemote(String userId, String projectId) {
        projectService.requireAccess(userId, projectId);
        if (!isInitialized(projectId)) {
            return new GitRemoteResponse("");
        }
        Path repo = getRepoPath(projectId);
        try {
            String url = runGit(repo, "remote", "get-url", "origin").trim();
            return new GitRemoteResponse(url);
        } catch (Exception e) {
            return new GitRemoteResponse("");
        }
    }

    public void setRemote(String userId, String projectId, String remoteUrl) {
        projectService.requireAccess(userId, projectId);
        Path repo = getRepoPath(projectId);
        try {
            boolean hasOrigin = false;
            try {
                runGit(repo, "remote", "get-url", "origin");
                hasOrigin = true;
            } catch (Exception ignored) {
            }

            if (hasOrigin) {
                runGit(repo, "remote", "set-url", "origin", remoteUrl.trim());
            } else {
                runGit(repo, "remote", "add", "origin", remoteUrl.trim());
            }
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to set remote: " + e.getMessage());
        }
    }

    public String push(String userId, String projectId, String remoteUrl, String branch, String username, String token) {
        projectService.requireAccess(userId, projectId);
        Path repo = getRepoPath(projectId);
        String targetBranch = (branch != null && !branch.isBlank()) ? branch.trim() : runGit(repo, "branch", "--show-current").trim();
        String targetUrl = resolveAuthenticatedUrl(repo, remoteUrl, username, token);

        return runGit(repo, "push", "-u", targetUrl, targetBranch);
    }

    public String pull(String userId, String projectId, String remoteUrl, String branch, String username, String token) {
        projectService.requireAccess(userId, projectId);
        Path repo = getRepoPath(projectId);
        String targetBranch = (branch != null && !branch.isBlank()) ? branch.trim() : runGit(repo, "branch", "--show-current").trim();
        String targetUrl = resolveAuthenticatedUrl(repo, remoteUrl, username, token);

        return runGit(repo, "pull", targetUrl, targetBranch);
    }

    private String resolveAuthenticatedUrl(Path repo, String remoteUrl, String username, String token) {
        String url = (remoteUrl != null && !remoteUrl.isBlank()) ? remoteUrl.trim() : null;
        if (url == null) {
            try {
                url = runGit(repo, "remote", "get-url", "origin").trim();
            } catch (Exception e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No remote origin configured");
            }
        }

        if (token != null && !token.isBlank() && url.startsWith("https://")) {
            String cleanUrl = url.substring("https://".length());
            if (cleanUrl.contains("@")) {
                cleanUrl = cleanUrl.substring(cleanUrl.indexOf('@') + 1);
            }
            String user = (username != null && !username.isBlank()) ? username.trim() : "git";
            return "https://" + user + ":" + token.trim() + "@" + cleanUrl;
        }
        return url;
    }

    public void createBranch(String userId, String projectId, String branchName) {
        projectService.requireAccess(userId, projectId);
        if (branchName == null || !SAFE_NAME.matcher(branchName).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid branch name");
        }
        Path repo = getRepoPath(projectId);
        runGit(repo, "branch", branchName);
    }

    public void checkout(String userId, String projectId, String branchName) {
        projectService.requireAccess(userId, projectId);
        if (branchName == null || !SAFE_NAME.matcher(branchName).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid branch name");
        }
        Path repo = getRepoPath(projectId);
        runGit(repo, "checkout", branchName);
    }

    public void syncWorkingTree(String userId, String projectId, Map<String, String> files) {
        projectService.requireAccess(userId, projectId);
        Path repo = getRepoPath(projectId);
        try {
            Files.createDirectories(repo);
            for (Map.Entry<String, String> entry : files.entrySet()) {
                String relPath = entry.getKey().replace('\\', '/');
                if (relPath.startsWith("/")) relPath = relPath.substring(1);
                Path target = repo.resolve(relPath).normalize();
                if (!target.startsWith(repo)) continue;

                Files.createDirectories(target.getParent());
                Files.writeString(target, entry.getValue());
            }
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to sync files: " + e.getMessage());
        }
    }

    public Map<String, String> readWorkingTree(String userId, String projectId) {
        projectService.requireAccess(userId, projectId);
        Path repo = getRepoPath(projectId);
        Map<String, String> files = new HashMap<>();
        try {
            if (!Files.exists(repo)) return files;

            Files.walk(repo).filter(Files::isRegularFile).forEach(path -> {
                Path rel = repo.relativize(path);
                String relStr = rel.toString().replace('\\', '/');
                if (!relStr.startsWith(".git/")) {
                    try {
                        files.put(relStr, Files.readString(path));
                    } catch (Exception ignored) {
                    }
                }
            });
            return files;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to read repository working tree: " + e.getMessage());
        }
    }

    private String runGit(Path workingDir, String... args) {
        try {
            List<String> command = new ArrayList<>();
            command.add("git");
            command.addAll(List.of(args));

            ProcessBuilder pb = new ProcessBuilder(command);
            pb.directory(workingDir.toFile());
            pb.redirectErrorStream(true);

            Process process = pb.start();
            StringBuilder out = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    out.append(line).append("\n");
                }
            }

            boolean finished = process.waitFor(10, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                throw new ResponseStatusException(HttpStatus.GATEWAY_TIMEOUT, "Git operation timed out");
            }

            if (process.exitValue() != 0) {
                String errorMsg = out.toString().trim();
                log.warn("Git command {} failed with code {}: {}", String.join(" ", command), process.exitValue(), errorMsg);
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, errorMsg);
            }

            return out.toString();
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Git command error: " + e.getMessage());
        }
    }
}

