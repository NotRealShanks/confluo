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
  const cleanLang = language.toLowerCase();
  switch (cleanLang) {
    case "cpp":
    case "c++":
      return `g++ -O2 -o /tmp/runner_bin "${entrypoint}" && /tmp/runner_bin`;
    case "c":
      return `gcc -O2 -o /tmp/runner_bin "${entrypoint}" && /tmp/runner_bin`;
    case "python":
    case "py":
      return `python3 "${entrypoint}"`;
    case "javascript":
    case "js":
      return `node "${entrypoint}"`;
    case "typescript":
    case "ts":
      return `npx tsx "${entrypoint}"`;
    case "java": {
      const fileName = path.basename(entrypoint, ".java");
      const dir = path.dirname(entrypoint);
      return `javac "${entrypoint}" && java -cp "${dir === "." ? "." : dir}" "${fileName}"`;
    }
    default:
      throw new Error(`Unsupported execution language: ${language}`);
  }
}

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "confluo-e2b-runner" });
});

app.post("/v1/execute", async (req: Request, res: Response) => {
  const { language, entrypoint, files } = req.body;
  const projectId = (req.headers["x-confluo-project"] as string) || "default";

  if (!language || !entrypoint || !Array.isArray(files)) {
    return res.status(400).json({ error: "Invalid request payload" });
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

    // If language is Java and javac isn't present, install JDK
    if (language.toLowerCase() === "java") {
      const checkJava = await sandbox.commands.run("which javac || true");
      if (!checkJava.stdout.trim()) {
        console.log("[E2B] Installing OpenJDK headless...");
        await sandbox.commands.run("sudo apt update -qq && sudo apt install -y -qq default-jdk-headless");
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

