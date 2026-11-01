import dotenv from "dotenv";
import path from "node:path";
import express, { type Request, type Response } from "express";
import { Sandbox } from "e2b";

dotenv.config({ path: path.resolve(import.meta.dirname, "../.env") });

const app = express();
app.use(express.json({ limit: "10mb" }));

const PORT = process.env.PORT || 4000;
const TIMEOUT_MS = 25_000;

function buildCommand(language: string, entrypoint: string): string {
  const cleanLang = (language || "").toLowerCase();
  switch (cleanLang) {
    case "shell":
    case "bash":
    case "sh":
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
      if (entrypoint.startsWith("g++") || entrypoint.startsWith("./")) {
        return entrypoint;
      }
      return `g++ -O2 -o a.out "${entrypoint}" && ./a.out`;
    case "c":
      if (entrypoint.startsWith("gcc") || entrypoint.startsWith("./")) {
        return entrypoint;
      }
      return `gcc -O2 -o a.out "${entrypoint}" && ./a.out`;
    case "python":
    case "py":
      if (entrypoint.startsWith("python")) {
        return entrypoint;
      }
      return `python3 "${entrypoint}"`;
    case "javascript":
    case "js":
      if (entrypoint.startsWith("node")) {
        return entrypoint;
      }
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

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "confluo-e2b-runner" });
});

// Service-to-service authentication middleware
app.use((req: Request, res: Response, next) => {
  const expectedToken = process.env.RUNNER_TOKEN;
  if (!expectedToken) {
    return next();
  }
  const providedToken =
    (req.headers["x-runner-token"] as string) ||
    req.headers.authorization?.replace(/^Bearer\s+/i, "");

  if (!providedToken || providedToken !== expectedToken) {
    return res.status(401).json({ error: "Unauthorized: Invalid or missing runner token" });
  }
  next();
});

app.post("/v1/execute", async (req: Request, res: Response) => {
  const { language, entrypoint, files } = req.body;
  const projectId = (req.headers["x-confluo-project"] as string) || "default";

  if (!language || !entrypoint || !Array.isArray(files)) {
    return res.status(400).json({ error: "Invalid request payload" });
  }

  // Validate entrypoint against command injection / path traversal
  const cleanLang = (language || "").toLowerCase();
  const isShell = cleanLang === "shell" || cleanLang === "bash" || cleanLang === "sh";
  if (!isShell && !/^[a-zA-Z0-9_\-./]+$/.test(entrypoint)) {
    return res.status(400).json({ error: "Invalid entrypoint syntax" });
  }

  // Validate all file paths against directory traversal
  for (const f of files) {
    if (
      typeof f.path !== "string" ||
      !f.path ||
      f.path.includes("..") ||
      f.path.startsWith("/") ||
      f.path.includes("\\") ||
      f.path.includes("\0")
    ) {
      return res.status(400).json({ error: "Invalid file path in payload" });
    }
  }

  let sandbox: Sandbox | null = null;
  let timedOut = false;

  try {
    const command = buildCommand(language, entrypoint);
    console.log(`[E2B] [Project: ${projectId}] Launching sandbox for ${language} (${entrypoint})...`);

    sandbox = await Sandbox.create({
      apiKey: process.env.E2B_API_KEY,
      timeoutMs: TIMEOUT_MS,
    });

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

    console.log(`[E2B] Running command: ${command}`);
    const result = await sandbox.commands.run(command, {
      cwd: workDir,
      timeoutMs: 15_000,
    });

    console.log(`[E2B] Execution completed. Exit code: ${result.exitCode}`);

    return res.json({
      stdout: result.stdout || "",
      stderr: result.stderr || "",
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
      stderr = "Execution timed out after 15 seconds.";
    }

    return res.json({
      stdout,
      stderr,
      exitCode,
      timedOut,
    });
  } finally {
    if (sandbox) {
      try {
        await sandbox.kill();
      } catch (killErr) {
        console.error("[E2B] Error killing sandbox:", killErr);
      }
    }
  }
});

app.listen(PORT, () => {
  console.log(`Confluo E2B Runner listening on http://localhost:${PORT}`);
});
