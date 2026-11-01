# Confluo Security Architecture & OWASP Top 10:2025 Mapping

This document details the security model, defensive controls, and architectural hardening implemented in Confluo, mapped directly to the **OWASP Top 10:2025** standard. It also documents known limitations and remaining risks honestly.

---

## OWASP Top 10:2025 Control Mapping

### A01: Broken Access Control
- **Role-Based Access Control (RBAC)**: All project operations enforce strict role checks (`OWNER`, `EDITOR`, `VIEWER`). Non-members receive HTTP 404 (preventing project ID enumeration and probing).
- **Execution Permissions**: Code execution endpoints (`/api/projects/{projectId}/run`) require `EDITOR` or `OWNER` role. Viewers are strictly denied (HTTP 403 `Only project editors can run code`).
- **Explicit Guest Restrictions**: Guest users authenticated via share links are explicitly forbidden from code execution and chat (HTTP 403 `Guests are not allowed to execute code`).
- **Direct Object Reference (IDOR) Protection**: MongoDB queries enforce tenancy filters (`findByIdAndProjectId`), preventing cross-project asset or message access.

### A02: Cryptographic Failures
- **Constant-Time Token Comparison**: Service-to-service authentication between Spring Boot and the Node.js runner utilizes `crypto.timingSafeEqual`, preventing timing side-channel attacks against shared secrets.
- **Strong Secret Requirements**: Shared runner secrets (`RUNNER_TOKEN` / `APP_EXECUTION_SERVICE_TOKEN`) are enforced to be at least 32 characters in all environments, failing closed on startup if absent or too short.
- **HMAC SHA-256 JWTs**: Authentication tokens are signed with HMAC-SHA256 with strict expirations (standard 24h, guest 1h).
- **No Hardcoded Production Secrets**: Default credentials (e.g. `confluo-internal-runner-secret`) were removed from configuration files.

### A03: Injection
- **Command Injection Protection**: Shell execution in the runner is separated into distinct compilation and execution phases. Arguments and filenames are strictly validated against `SAFE_PATH_PATTERN` (`^[a-zA-Z0-9_\-./]+$`). Semicolons, pipes, subshells, and null bytes are rejected upfront.
- **Language Allowlist**: The runner enforces a strict set of 32 allowed language runtimes; arbitrary or unverified language identifiers return HTTP 400.
- **Control Character Stripping**: Chat messages strip ASCII control characters (`\u0000` to `\u001F`, `\u007F`), preventing terminal escape code injection and control payload execution while preserving standard whitespace (`\n`, `\t`, `\r`).
- **Path Traversal Defense**: All workspace file paths and entrypoints are validated to forbid `..`, leading slashes `/`, Windows backslashes `\`, null bytes `\0`, and lengths > 200 characters.

### A04: Insecure Design
- **Fail-Closed Architecture**: The runner middleware rejects execution requests by default if tokens do not match, and refuses to bind if the environment token is missing or short.
- **Resource Quotas & Payload Capping**:
  - Request body parser capped at 2 MB.
  - Maximum 100 files per execution payload.
  - Maximum 200 KB per individual file.
  - Maximum 1 MB aggregate file content.
  - Real-time stdout/stderr stream truncation to 100 KB.
  - Strict runner concurrency cap (maximum 2 simultaneous sandboxes returning HTTP 429).
  - Per-user rate limiting: 20 chat messages/minute, 30 burst execution requests/minute, and 60 executions/hour.
- **PostMessage Sandboxing**: The frontend `BrowserPreview` iframe accepts messages only when `event.source === iframe.contentWindow` and the payload matches typed schemas (`CONFLUO_PREVIEW_NAVIGATE`, `CONFLUO_PREVIEW_ERROR`). The dangerous `allow-popups-to-escape-sandbox` capability was removed.

### A05: Security Misconfiguration
- **Localhost Default Binding**: Runner binds strictly to loopback (`127.0.0.1`) by default, preventing unintended network exposure on shared interfaces.
- **HTTP Client Timeouts**: Backend runner client configures strict timeouts (3-second connection timeout, 40-second read timeout) via `SimpleClientHttpRequestFactory`.
- **Sanitized Error Responses**: Internal Java stack traces, database exceptions, internal URLs, and runner tokens are caught and translated into friendly user messages before being returned to clients or rendered in the UI.

### A06: Vulnerable and Outdated Components
- **Dependency Audit**: `npm audit` in `frontend/` reports **0 vulnerabilities**.
- **Secure Overrides**: `dompurify` pinned to `^3.4.17` via package overrides, and `vite` upgraded to `^8.3.3` to eliminate known CVEs.
- **Automated Scanning**: Frontend dependencies locked via strict `package-lock.json`.

### A07: Identification and Authentication Failures
- **Token Verification**: Every execution request requires a valid `X-Runner-Token` header.
- **Safe Health Probing**: `/health` endpoint returns only operational status (`{"status":"ok"}`) and is decoupled from authentication tokens.
- **No Token Logging**: Secrets and authentication tokens are strictly masked and never logged to console or stderr.

### A08: Software and Data Integrity Failures
- **Deterministic Workspace Trees**: Yjs CRDT operations utilize bounded tree parsing with cycle detection, parent validation, and name deduplication, preventing workspace corruption or crash loops.
- **Sandbox Process Cleanup**: E2B cloud sandboxes are cleanly terminated in `finally` blocks on completion, error, timeout, or client disconnect (`req.on("close")`).

### A09: Security Logging and Monitoring Failures
- **Preflight Validation**: Added `scripts/preflight.ps1` to verify end-to-end service connectivity and health before live deployment or demonstration.
- **Audit Logging**: Project activity records track member invitations, file operations, role updates, and execution status without leaking payload contents or user tokens.

### A10: Server-Side Request Forgery (SSRF)
- **Controlled Egress**: Backend communicates only with pre-configured `APP_EXECUTION_SERVICE_URL`. Dynamic, user-controlled URLs are never fetched server-side.
- **Sandbox Boundary**: Runner code execution takes place inside isolated E2B microVMs, fully segregated from the host Confluo backend, database, and infrastructure.

---

## Known Limitations & Honest Disclosure

1. **Process-Local Rate Limiting & Concurrency**:
   - *Limitation*: The `RateLimitService` and concurrent execution tracking use in-memory state (`LinkedHashMap`, `ConcurrentHashMap`).
   - *Implication*: Limits apply per application instance and reset upon service restart. Multi-instance horizontal scaling would require a shared Redis or Memcached store.
2. **E2B Sandbox Network Access**:
   - *Limitation*: Standard E2B cloud microVM sandboxes have outbound internet access by default (to download package dependencies like `pip` or `npm`).
   - *Implication*: Untrusted code could make outbound HTTP requests. Production deployments with strict isolation should configure E2B network policies to disable egress where internet access is not required.
3. **CRDT History Storage**:
   - *Limitation*: Yjs CRDT document history grows monotonically in Liveblocks storage without automatic tombstone compaction for long-lived workspaces.
   - *Implication*: Heavy editing over months could increase initial document sync size. Periodic snapshot compaction is recommended for production.
4. **Local Dev Origin Sharing**:
   - *Limitation*: In local development, the browser preview iframe is served via `srcDoc` in the same origin as the frontend. While HTML5 sandbox attributes (`sandbox="allow-scripts allow-modals allow-forms allow-popups"`) isolate it and `allow-same-origin` is omitted, production environments should ideally serve user-generated HTML from a dedicated untrusted sandbox domain (e.g. `preview.confluo.io`).
