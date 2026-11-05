import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import express, { type Request, type Response, type NextFunction } from "express";
import { Sandbox } from "e2b";

dotenv.config({ path: path.resolve(import.meta.dirname, "../.env") });

export const LIMITS = {
  MAX_FILES: 100,
  MAX_FILE_SIZE: 500_000, // 500 KB per file
  MAX_AGGREGATE_FILE_SIZE: 1_000_000, // 1 MB total files size
  MAX_PATH_LENGTH: 200, // Maximum allowed path length
  MAX_ENTRYPOINT_LENGTH: 200, // Maximum allowed entrypoint length
  MAX_OUTPUT_LENGTH: 100_000, // 100,000 characters per stream
  MAX_CONCURRENT_EXECUTIONS: 2, // Allow at most 2 concurrent sandboxes
  EXECUTION_TIMEOUT_MS: 15_000,
  SANDBOX_TIMEOUT_MS: 25_000,
};

export const ALLOWED_LANGUAGES = new Set([
  "shell",
  "bash",
  "sh",
  "cpp",
  "c++",
  "cpp-compile",
  "cpp-run",
  "c",
  "c-compile",
  "c-run",
  "python",
  "py",
  "javascript",
  "js",
  "typescript",
  "ts",
  "csharp",
  "cs",
  "java",
  "kotlin",
  "kt",
  "scala",
  "go",
  "rust",
  "rs",
  "php",
  "ruby",
  "rb",
  "swift",
  "dart",
  "r",
  "sql",
]);

let activeExecutions = 0;

export function getActiveExecutions(): number {
  return activeExecutions;
}

export function setActiveExecutionsForTesting(count: number): void {
  activeExecutions = count;
}

/**
 * Constant-time token verification using SHA-256 fixed-size hashes.
 * Avoids leaking token lengths or contents through timing side channels.
 */
export function timingSafeEqualTokens(provided: string, expected: string): boolean {
  if (typeof provided !== "string" || typeof expected !== "string" || !provided || !expected) {
    return false;
  }
  const hashProvided = crypto.createHash("sha256").update(provided).digest();
  const hashExpected = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(hashProvided, hashExpected);
}

/**
 * Validates configuration at service startup.
 * Fails closed: refuses to start unless RUNNER_TOKEN is set and at least 32 characters.
 */
export function validateStartupConfig(token?: string) {
  const rawToken = token !== undefined ? token : process.env.RUNNER_TOKEN;
  const cleanToken = (rawToken || "").trim();
  if (!cleanToken || cleanToken.length < 32) {
    throw new Error(
      "FATAL: RUNNER_TOKEN is required and must be at least 32 characters long.",
    );
  }
}

/**
 * Truncates output to prevent memory exhaustion and excessive response payloads.
 */
export function truncateOutput(output: string, maxLength = LIMITS.MAX_OUTPUT_LENGTH): string {
  if (!output || output.length <= maxLength) return output || "";
  return output.slice(0, maxLength) + `\n... [Output truncated after ${maxLength} characters]`;
}

/**
 * Pure function: Validates the execution request body, entrypoint syntax, path traversal,
 * allowed languages, file sizes, and aggregate limits.
 */
export function validateExecutionPayload(body: any): { valid: true } | { valid: false; error: string } {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Invalid request payload: JSON object expected" };
  }

  const { language, entrypoint, files } = body;
  if (!language || typeof language !== "string" || !entrypoint || typeof entrypoint !== "string" || !Array.isArray(files)) {
    return { valid: false, error: "Invalid request payload: language, entrypoint, and files array are required" };
  }

  const cleanLang = language.trim().toLowerCase();
  if (!ALLOWED_LANGUAGES.has(cleanLang)) {
    return {
      valid: false,
      error: `Unknown language '${language}'. Supported languages: ${Array.from(ALLOWED_LANGUAGES).join(", ")}`,
    };
  }

  const cleanEntrypoint = entrypoint.trim();
  if (!cleanEntrypoint || cleanEntrypoint.length > LIMITS.MAX_ENTRYPOINT_LENGTH) {
    return { valid: false, error: `Invalid entrypoint: length must be between 1 and ${LIMITS.MAX_ENTRYPOINT_LENGTH} characters` };
  }

  // Traversal & absolute path checks on entrypoint
  if (
    cleanEntrypoint.includes("..") ||
    cleanEntrypoint.startsWith("/") ||
    cleanEntrypoint.includes("\\") ||
    cleanEntrypoint.includes("\0") ||
    cleanEntrypoint.includes(":")
  ) {
    return { valid: false, error: "Invalid entrypoint: path traversal or absolute paths are not permitted" };
  }

  // Prevent argument injection (compiler flags starting with -)
  if (cleanEntrypoint.startsWith("-")) {
    return { valid: false, error: "Invalid entrypoint: cannot start with a hyphen" };
  }

  // For non-shell languages, strictly disallow command injection characters
  const isShell = cleanLang === "shell" || cleanLang === "bash" || cleanLang === "sh";
  if (!isShell) {
    if (!/^[a-zA-Z0-9_][a-zA-Z0-9_\-./]*$/.test(cleanEntrypoint) || /[;&|`$()<>\n\r]/.test(cleanEntrypoint)) {
      return { valid: false, error: "Invalid entrypoint syntax: special shell characters are not permitted" };
    }
  }

  // Validate files count and file content sizes
  if (files.length > LIMITS.MAX_FILES) {
    return { valid: false, error: `Too many files: maximum allowed is ${LIMITS.MAX_FILES}` };
  }

  let totalSize = 0;
  for (const f of files) {
    if (!f || typeof f !== "object" || typeof f.path !== "string" || typeof f.content !== "string") {
      return { valid: false, error: "Invalid file entry: path and content strings are required" };
    }

    const rawPath = f.path.trim();
    if (rawPath.length > LIMITS.MAX_PATH_LENGTH) {
      return { valid: false, error: `Invalid file path '${f.path}': length exceeds maximum of ${LIMITS.MAX_PATH_LENGTH} characters` };
    }

    const normalizedPath = path.posix.normalize(rawPath);

    if (
      !normalizedPath ||
      normalizedPath === "." ||
      normalizedPath.startsWith("..") ||
      normalizedPath.startsWith("/") ||
      rawPath.includes("..") ||
      rawPath.includes("\\") ||
      rawPath.includes("\0") ||
      rawPath.includes(":")
    ) {
      return { valid: false, error: `Invalid file path '${f.path}': directory traversal or invalid characters detected` };
    }

    const fileSize = Buffer.byteLength(f.content, "utf8");
    if (fileSize > LIMITS.MAX_FILE_SIZE) {
      return { valid: false, error: `File '${f.path}' exceeds maximum size of ${LIMITS.MAX_FILE_SIZE} bytes` };
    }
    totalSize += fileSize;
    if (totalSize > LIMITS.MAX_AGGREGATE_FILE_SIZE) {
      return { valid: false, error: `Aggregate files size exceeds maximum limit of ${LIMITS.MAX_AGGREGATE_FILE_SIZE} bytes` };
    }
  }

  return { valid: true };
}

/**
 * Pure function: Builds safe execution command for supported languages.
 * Non-shell languages strictly treat entrypoint as a path.
 */
export function buildCommand(language: string, entrypoint: string): string {
  const cleanLang = (language || "").toLowerCase();
  switch (cleanLang) {
    case "shell":
    case "bash":
    case "sh":
      // Restricted to authorized project members (OWNER/EDITOR) verified by backend
      return entrypoint;
    case "cpp-compile":
      return `g++ -O2 -o a.out "${entrypoint}"`;
    case "cpp-run": {
      const target = entrypoint.replace(/^\.\//, "");
      if (target.endsWith(".cpp") || target.endsWith(".cc")) {
        return `g++ -O2 -o a.out "${target}" && ./a.out`;
      }
      return `if [ ! -f "${target}" ]; then g++ -O2 -o "${target}" *.cpp; fi && ./"${target}"`;
    }
    case "c-compile":
      return `gcc -O2 -o a.out "${entrypoint}"`;
    case "c-run": {
      const target = entrypoint.replace(/^\.\//, "");
      if (target.endsWith(".c")) {
        return `gcc -O2 -o a.out "${target}" && ./a.out`;
      }
      return `if [ ! -f "${target}" ]; then gcc -O2 -o "${target}" *.c; fi && ./"${target}"`;
    }
    case "cpp":
    case "c++":
      return `g++ -O2 -o a.out "${entrypoint}" && ./a.out`;
    case "c":
      return `gcc -O2 -o a.out "${entrypoint}" && ./a.out`;
    case "python":
    case "py":
      return `python3 "${entrypoint}"`;
    case "javascript":
    case "js":
      return `node "${entrypoint}"`;
    case "typescript":
    case "ts":
      return `npx tsx "${entrypoint}"`;
    case "csharp":
    case "cs":
      return `mcs "${entrypoint}" -out:a.exe && mono a.exe`;
    case "java": {
      const fileName = path.basename(entrypoint, ".java");
      const dir = path.dirname(entrypoint);
      return `javac "${entrypoint}" && java -cp "${dir === "." ? "." : dir}" "${fileName}"`;
    }
    case "kotlin":
    case "kt":
      return `kotlinc "${entrypoint}" -include-runtime -d app.jar && java -jar app.jar`;
    case "scala":
      return `scala "${entrypoint}"`;
    case "go":
      return `go run "${entrypoint}"`;
    case "rust":
    case "rs":
      return `rustc -O -o a.out "${entrypoint}" && ./a.out`;
    case "php":
      return `php "${entrypoint}"`;
    case "ruby":
    case "rb":
      return `ruby "${entrypoint}"`;
    case "swift":
      return `swift "${entrypoint}"`;
    case "dart":
      return `dart run "${entrypoint}"`;
    case "r":
      return `Rscript "${entrypoint}"`;
    case "sql":
      return `sqlite3 :memory: < "${entrypoint}"`;
    default:
      return entrypoint;
  }
}

const toolPackages: Record<string, { checkCmd: string; installCmd: string }> = {
  java: { checkCmd: "which javac || true", installCmd: "sudo apt update -qq && sudo apt install -y -qq default-jdk-headless" },
  rust: { checkCmd: "which rustc || true", installCmd: "sudo apt update -qq && sudo apt install -y -qq rustc" },
  rs: { checkCmd: "which rustc || true", installCmd: "sudo apt update -qq && sudo apt install -y -qq rustc" },
  go: { checkCmd: "which go || true", installCmd: "sudo apt update -qq && sudo apt install -y -qq golang-go" },
  php: { checkCmd: "which php || true", installCmd: "sudo apt update -qq && sudo apt install -y -qq php-cli" },
  ruby: { checkCmd: "which ruby || true", installCmd: "sudo apt update -qq && sudo apt install -y -qq ruby" },
  rb: { checkCmd: "which ruby || true", installCmd: "sudo apt update -qq && sudo apt install -y -qq ruby" },
  r: { checkCmd: "which Rscript || true", installCmd: "sudo apt update -qq && sudo apt install -y -qq r-base-core" },
  sql: { checkCmd: "which sqlite3 || true", installCmd: "sudo apt update -qq && sudo apt install -y -qq sqlite3" },
  csharp: { checkCmd: "which mcs || which dotnet || true", installCmd: "sudo apt update -qq && sudo apt install -y -qq mono-mcs mono-runtime" },
  cs: { checkCmd: "which mcs || which dotnet || true", installCmd: "sudo apt update -qq && sudo apt install -y -qq mono-mcs mono-runtime" },
  kotlin: { checkCmd: "which kotlinc || true", installCmd: "sudo apt update -qq && sudo apt install -y -qq default-jdk-headless kotlin" },
  kt: { checkCmd: "which kotlinc || true", installCmd: "sudo apt update -qq && sudo apt install -y -qq default-jdk-headless kotlin" },
  scala: { checkCmd: "which scala || true", installCmd: "sudo apt update -qq && sudo apt install -y -qq scala" },
  dart: { checkCmd: "which dart || true", installCmd: "sudo apt update -qq && sudo apt install -y -qq dart" },
};

export const app = express();
app.use(express.json({ limit: "2mb" }));

// Health endpoint - strictly non-sensitive status
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "confluo-e2b-runner",
    timestamp: new Date().toISOString(),
  });
});

/**
 * Service-to-service authentication middleware.
 * Never bypasses authentication silently.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.path === "/health") {
    return next();
  }

  const currentExpectedToken = process.env.RUNNER_TOKEN?.trim() || "";
  if (!currentExpectedToken) {
    return res.status(503).json({
      error: "Service Unavailable: Runner service authentication is not configured",
    });
  }

  const headerVal = req.headers["x-runner-token"];
  const authHeader = req.headers.authorization;
  const rawProvidedToken =
    (typeof headerVal === "string" ? headerVal.trim() : Array.isArray(headerVal) ? headerVal[0]?.trim() : "") ||
    (typeof authHeader === "string" && authHeader.toLowerCase().startsWith("bearer ")
      ? authHeader.slice(7).trim()
      : "");

  if (!rawProvidedToken) {
    return res.status(401).json({
      error: "Unauthorized: Missing runner token",
    });
  }

  if (!timingSafeEqualTokens(rawProvidedToken, currentExpectedToken)) {
    return res.status(401).json({
      error: "Unauthorized: Invalid runner token",
    });
  }

  next();
}

app.use(authMiddleware);

app.post("/v1/execute", async (req: Request, res: Response) => {
  // Concurrency limit guard (maximum 2 concurrent sandboxes)
  if (activeExecutions >= LIMITS.MAX_CONCURRENT_EXECUTIONS) {
    return res.status(429).json({
      error: "Too Many Requests: Runner execution capacity reached (maximum 2 concurrent sandboxes). Please retry shortly.",
    });
  }

  const validation = validateExecutionPayload(req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  const { language, entrypoint, files } = req.body;
  const projectId = (req.headers["x-confluo-project"] as string) || "default";
  const cleanLang = (language || "").toLowerCase();

  activeExecutions++;
  let sandbox: Sandbox | null = null;
  let timedOut = false;

  try {
    const command = buildCommand(language, entrypoint);
    console.log(`[E2B] [Project: ${projectId}] Launching sandbox for ${language} (${entrypoint})...`);

    sandbox = await Sandbox.create({
      apiKey: process.env.E2B_API_KEY,
      timeoutMs: LIMITS.SANDBOX_TIMEOUT_MS,
    });

    // Abort and tear down sandbox immediately if client disconnects early
    const onClientClose = () => {
      if (!res.writableEnded && sandbox) {
        console.log(`[E2B] [Project: ${projectId}] Client disconnected. Terminating sandbox.`);
        sandbox.kill().catch(() => {});
      }
    };
    req.on("close", onClientClose);

    const workDir = "/home/user/project";
    await sandbox.commands.run(`mkdir -p ${workDir}`);

    // Check runtime dependencies and auto-install if missing
    const toolInfo = toolPackages[cleanLang];
    if (toolInfo) {
      const checkRes = await sandbox.commands.run(toolInfo.checkCmd);
      if (!checkRes.stdout.trim()) {
        console.log(`[E2B] Installing runtime for ${cleanLang}...`);
        await sandbox.commands.run(toolInfo.installCmd);
      }
    }

    // Write all project files to sandbox
    if (files.length > 0) {
      const filePayload = files.map((f: { path: string; content: string }) => ({
        path: `${workDir}/${f.path}`,
        data: f.content,
      }));
      await sandbox.files.write(filePayload);
    }

    // Real-time bounded streaming of stdout and stderr
    let stdoutAcc = "";
    let stderrAcc = "";
    let stdoutTruncated = false;
    let stderrTruncated = false;

    console.log(`[E2B] Running command: ${command}`);
    const result = await sandbox.commands.run(command, {
      cwd: workDir,
      timeoutMs: LIMITS.EXECUTION_TIMEOUT_MS,
      onStdout: (chunk: string) => {
        if (stdoutAcc.length < LIMITS.MAX_OUTPUT_LENGTH) {
          const remaining = LIMITS.MAX_OUTPUT_LENGTH - stdoutAcc.length;
          stdoutAcc += chunk.slice(0, remaining);
          if (chunk.length > remaining) {
            stdoutTruncated = true;
          }
        } else {
          stdoutTruncated = true;
        }
      },
      onStderr: (chunk: string) => {
        if (stderrAcc.length < LIMITS.MAX_OUTPUT_LENGTH) {
          const remaining = LIMITS.MAX_OUTPUT_LENGTH - stderrAcc.length;
          stderrAcc += chunk.slice(0, remaining);
          if (chunk.length > remaining) {
            stderrTruncated = true;
          }
        } else {
          stderrTruncated = true;
        }
      },
    });

    console.log(`[E2B] Execution completed. Exit code: ${result.exitCode}`);

    const finalStdout = stdoutTruncated
      ? truncateOutput(stdoutAcc, LIMITS.MAX_OUTPUT_LENGTH)
      : stdoutAcc || truncateOutput(result.stdout || "");
    const finalStderr = stderrTruncated
      ? truncateOutput(stderrAcc, LIMITS.MAX_OUTPUT_LENGTH)
      : stderrAcc || truncateOutput(result.stderr || "");

    return res.json({
      stdout: finalStdout,
      stderr: finalStderr,
      exitCode: result.exitCode ?? 0,
      timedOut: false,
    });
  } catch (err: any) {
    console.error("[E2B] Execution error:", err?.message || err);

    let stderr = err?.message || "Execution failed";
    let exitCode = 1;
    let stdout = "";

    if (err?.result) {
      stdout = err.result.stdout || "";
      stderr = err.result.stderr || err.result.error || "";
      exitCode = err.result.exitCode ?? 1;
    } else if (err?.name === "TimeoutError" || String(err).includes("timeout")) {
      timedOut = true;
      stderr = `Execution timed out after ${LIMITS.EXECUTION_TIMEOUT_MS / 1000} seconds.`;
    }

    return res.json({
      stdout: truncateOutput(stdout),
      stderr: truncateOutput(stderr),
      exitCode,
      timedOut,
    });
  } finally {
    activeExecutions--;
    if (sandbox) {
      try {
        await sandbox.kill();
      } catch (killErr) {
        console.error("[E2B] Error killing sandbox:", killErr);
      }
    }
  }
});

const PORT = Number(process.env.PORT) || 4000;
const HOST = process.env.HOST || "0.0.0.0";
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMain && process.env.NODE_ENV !== "test") {
  try {
    validateStartupConfig();
  } catch (err: any) {
    console.error(err.message);
    process.exit(1);
  }

  app.listen(PORT, HOST, () => {
    console.log(`Confluo E2B Runner listening on http://${HOST}:${PORT}`);
  });
}
