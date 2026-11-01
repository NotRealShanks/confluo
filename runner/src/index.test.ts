import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import {
  app,
  timingSafeEqualTokens,
  validateStartupConfig,
  validateExecutionPayload,
  truncateOutput,
  buildCommand,
  LIMITS,
  setActiveExecutionsForTesting,
} from "./index.ts";

describe("Runner Security & Authentication", () => {
  describe("validateStartupConfig", () => {
    it("fails startup in production if RUNNER_TOKEN is missing or empty", () => {
      assert.throws(
        () => validateStartupConfig("", "production"),
        /RUNNER_TOKEN is required/,
      );
      assert.throws(
        () => validateStartupConfig("   ", "production"),
        /RUNNER_TOKEN is required/,
      );
    });

    it("fails startup in production if RUNNER_TOKEN is too short (< 16 chars)", () => {
      assert.throws(
        () => validateStartupConfig("short-secret", "production"),
        /at least 16 characters/,
      );
    });

    it("succeeds in production when RUNNER_TOKEN has adequate entropy", () => {
      assert.doesNotThrow(() =>
        validateStartupConfig("a-very-long-production-runner-token-secret-12345", "production"),
      );
    });

    it("does not throw in development even if RUNNER_TOKEN is empty", () => {
      assert.doesNotThrow(() => validateStartupConfig("", "development"));
    });
  });

  describe("timingSafeEqualTokens", () => {
    it("returns true for matching tokens", () => {
      assert.equal(timingSafeEqualTokens("secret123", "secret123"), true);
      assert.equal(
        timingSafeEqualTokens("confluo-internal-secret-token", "confluo-internal-secret-token"),
        true,
      );
    });

    it("returns false for non-matching tokens of same length", () => {
      assert.equal(timingSafeEqualTokens("secret123", "secret124"), false);
    });

    it("returns false for non-matching tokens of different lengths without throwing", () => {
      assert.equal(timingSafeEqualTokens("short", "much-longer-token-value"), false);
      assert.equal(timingSafeEqualTokens("much-longer-token-value", "short"), false);
    });

    it("returns false for empty, null, or invalid inputs", () => {
      assert.equal(timingSafeEqualTokens("", "secret"), false);
      assert.equal(timingSafeEqualTokens("secret", ""), false);
      assert.equal(timingSafeEqualTokens(null as any, "secret"), false);
      assert.equal(timingSafeEqualTokens("secret", undefined as any), false);
    });
  });

  describe("validateExecutionPayload", () => {
    it("rejects non-object or missing required fields", () => {
      assert.equal(validateExecutionPayload(null).valid, false);
      assert.equal(validateExecutionPayload({}).valid, false);
      assert.equal(
        validateExecutionPayload({ language: "python" }).valid,
        false,
      );
      assert.equal(
        validateExecutionPayload({ language: "python", entrypoint: "main.py" }).valid,
        false,
      );
    });

    it("rejects invalid language identifiers", () => {
      const res = validateExecutionPayload({
        language: "python; rm -rf /",
        entrypoint: "main.py",
        files: [],
      });
      assert.equal(res.valid, false);
      if (!res.valid) {
        assert.match(res.error, /Invalid language identifier/);
      }
    });

    it("rejects directory traversal in entrypoint", () => {
      const attempts = [
        "../etc/passwd",
        "..\\windows\\system32",
        "/absolute/path.py",
        "nested/../../secret.py",
        "file\0null.py",
        "C:\\secret.py",
      ];
      for (const entrypoint of attempts) {
        const res = validateExecutionPayload({
          language: "python",
          entrypoint,
          files: [],
        });
        assert.equal(res.valid, false, `Expected rejection for: ${entrypoint}`);
      }
    });

    it("rejects compiler flag / argument injection in entrypoint", () => {
      const flagAttempts = ["-o /etc/malicious", "-Wall", "--help", "-c"];
      for (const entrypoint of flagAttempts) {
        const res = validateExecutionPayload({
          language: "cpp",
          entrypoint,
          files: [],
        });
        assert.equal(res.valid, false, `Expected rejection for flag: ${entrypoint}`);
        if (!res.valid) {
          assert.match(res.error, /cannot start with a hyphen/);
        }
      }
    });

    it("rejects command injection characters in non-shell entrypoint", () => {
      const cmdInjections = [
        "main.py; echo hacked",
        "main.py && rm -rf",
        "main.py | bash",
        "`whoami`.py",
        "$(whoami).py",
        "main.py > /dev/null",
        "main.py\necho 1",
      ];
      for (const entrypoint of cmdInjections) {
        const res = validateExecutionPayload({
          language: "python",
          entrypoint,
          files: [],
        });
        assert.equal(res.valid, false, `Expected rejection for injection: ${entrypoint}`);
      }
    });

    it("allows shell commands when language is shell/bash/sh", () => {
      const res = validateExecutionPayload({
        language: "bash",
        entrypoint: "echo 'hello world' && ls -la",
        files: [],
      });
      assert.equal(res.valid, true);
    });

    it("rejects payloads exceeding MAX_FILES", () => {
      const files = Array.from({ length: LIMITS.MAX_FILES + 1 }, (_, i) => ({
        path: `file${i}.txt`,
        content: "test",
      }));
      const res = validateExecutionPayload({
        language: "python",
        entrypoint: "main.py",
        files,
      });
      assert.equal(res.valid, false);
      if (!res.valid) {
        assert.match(res.error, /Too many files/);
      }
    });

    it("rejects path traversal in file paths", () => {
      const badPaths = [
        "../outside.txt",
        "..\\windows.txt",
        "/absolute.txt",
        "a/../../b.txt",
        "file\0null.txt",
        "C:\\autoexec.bat",
      ];
      for (const badPath of badPaths) {
        const res = validateExecutionPayload({
          language: "python",
          entrypoint: "main.py",
          files: [{ path: badPath, content: "malicious" }],
        });
        assert.equal(res.valid, false, `Expected rejection for file path: ${badPath}`);
      }
    });

    it("rejects individual file exceeding MAX_FILE_SIZE", () => {
      const oversizedContent = "A".repeat(LIMITS.MAX_FILE_SIZE + 10);
      const res = validateExecutionPayload({
        language: "python",
        entrypoint: "main.py",
        files: [{ path: "big.txt", content: oversizedContent }],
      });
      assert.equal(res.valid, false);
      if (!res.valid) {
        assert.match(res.error, /exceeds maximum size/);
      }
    });

    it("accepts valid, benign execution payload", () => {
      const res = validateExecutionPayload({
        language: "python",
        entrypoint: "src/main.py",
        files: [
          { path: "src/main.py", content: "print('Hello, world!')" },
          { path: "data/input.json", content: "{\"key\": \"val\"}" },
        ],
      });
      assert.equal(res.valid, true);
    });
  });

  describe("truncateOutput", () => {
    it("returns output as-is when below limit", () => {
      assert.equal(truncateOutput("short stdout"), "short stdout");
    });

    it("truncates and adds marker when exceeding limit", () => {
      const longOutput = "X".repeat(200);
      const truncated = truncateOutput(longOutput, 50);
      assert.equal(truncated.startsWith("X".repeat(50)), true);
      assert.match(truncated, /\[Output truncated after 50 characters\]/);
    });
  });

  describe("buildCommand", () => {
    it("compiles and runs C++ properly", () => {
      assert.equal(
        buildCommand("cpp", "main.cpp"),
        'g++ -O2 -o a.out "main.cpp" && ./a.out',
      );
    });

    it("compiles and runs C properly", () => {
      assert.equal(
        buildCommand("c", "main.c"),
        'gcc -O2 -o a.out "main.c" && ./a.out',
      );
    });

    it("runs Python with python3", () => {
      assert.equal(buildCommand("python", "app.py"), 'python3 "app.py"');
    });

    it("runs TypeScript with npx tsx", () => {
      assert.equal(buildCommand("typescript", "index.ts"), 'npx tsx "index.ts"');
    });

    it("runs Java with javac and java", () => {
      assert.equal(
        buildCommand("java", "com/example/Main.java"),
        'javac "com/example/Main.java" && java -cp "com/example" "Main"',
      );
    });
  });

  describe("HTTP Service Endpoints", () => {
    const TEST_TOKEN = "test-internal-runner-secret-key-123456";
    let server: Server;
    let baseUrl: string;

    before((_, done) => {
      process.env.RUNNER_TOKEN = TEST_TOKEN;
      server = app.listen(0, () => {
        const addr = server.address();
        if (typeof addr === "object" && addr) {
          baseUrl = `http://127.0.0.1:${addr.port}`;
          done();
        }
      });
    });

    after((_, done) => {
      server.close(() => done());
    });

    it("/health is accessible without authentication and does not leak secrets", async () => {
      const res = await fetch(`${baseUrl}/health`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.status, "ok");
      assert.equal(data.service, "confluo-e2b-runner");
      assert.equal(data.RUNNER_TOKEN, undefined);
      assert.equal(data.E2B_API_KEY, undefined);
    });

    it("/v1/execute rejects requests with no token (401)", async () => {
      const res = await fetch(`${baseUrl}/v1/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: "python",
          entrypoint: "main.py",
          files: [],
        }),
      });
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.match(data.error, /Missing runner token/);
    });

    it("/v1/execute rejects requests with an invalid token (401)", async () => {
      const res = await fetch(`${baseUrl}/v1/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Runner-Token": "wrong-token-value",
        },
        body: JSON.stringify({
          language: "python",
          entrypoint: "main.py",
          files: [],
        }),
      });
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.match(data.error, /Invalid runner token/);
    });

    it("/v1/execute accepts Bearer authorization header with correct token", async () => {
      const res = await fetch(`${baseUrl}/v1/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${TEST_TOKEN}`,
        },
        body: JSON.stringify({
          language: "python",
          entrypoint: "../invalid/path.py",
          files: [],
        }),
      });
      // Authenticated successfully, but rejected by payload validation (400)
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.match(data.error, /path traversal/);
    });

    it("/v1/execute rejects requests when active execution limit is reached (429)", async () => {
      setActiveExecutionsForTesting(LIMITS.MAX_CONCURRENT_EXECUTIONS);
      try {
        const res = await fetch(`${baseUrl}/v1/execute`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Runner-Token": TEST_TOKEN,
          },
          body: JSON.stringify({
            language: "python",
            entrypoint: "main.py",
            files: [],
          }),
        });
        assert.equal(res.status, 429);
        const data = await res.json();
        assert.match(data.error, /capacity reached/);
      } finally {
        setActiveExecutionsForTesting(0);
      }
    });

    it("/v1/execute returns 503 if RUNNER_TOKEN is unconfigured on server", async () => {
      const saved = process.env.RUNNER_TOKEN;
      process.env.RUNNER_TOKEN = "";
      try {
        const res = await fetch(`${baseUrl}/v1/execute`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Runner-Token": "some-token",
          },
          body: JSON.stringify({
            language: "python",
            entrypoint: "main.py",
            files: [],
          }),
        });
        assert.equal(res.status, 503);
        const data = await res.json();
        assert.match(data.error, /authentication is not configured/);
      } finally {
        process.env.RUNNER_TOKEN = saved;
      }
    });
  });
});
