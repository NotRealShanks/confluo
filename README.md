# Confluo

Confluo is a modern, real-time collaborative cloud IDE and code editor with live presence, shared Monaco editor sessions, project chat, activity logs, file management, HTML preview, and isolated code execution sandboxes.

---

## Architecture Overview

```
                      +-----------------------------+
                      |   Browser / React Frontend  |
                      |   (Vite + React 19 + TS)    |
                      +--------------+--------------+
                                     |
               +---------------------+---------------------+
               | HTTP / REST                               | WebSocket
               v                                           v
+-------------------------------+             +---------------------------+
|      Spring Boot Backend      |             |     Liveblocks Cloud      |
|    (Java 25 + Spring Web)     |             |      (Yjs Realtime)       |
+---------------+---------------+             +---------------------------+
                |
     +----------+----------+
     | HTTP + Token Auth   | MongoDB Atlas
     v                     v
+------------------+  +--------------------+
| Node.js Runner   |  |   MongoDB Store    |
| (E2B Sandboxes)  |  +--------------------+
+------------------+
```

- **Frontend (`frontend/`)**: React 19, TypeScript, Vite, Monaco Editor, Tailwind CSS, Lucide icons.
- **Backend (`backend/`)**: Spring Boot 4, Java 25, Spring Security with JWT & OAuth2, Spring Data MongoDB.
- **Runner (`runner/`)**: Node.js, Express, TypeScript, E2B Cloud Sandboxes for secure isolated code execution.
- **Collaboration**: Liveblocks Yjs provider powering real-time multi-user typing, presence badges, live cursors, inline comments, and notifications.
- **Database**: MongoDB storing user accounts, project metadata, assets, chat messages, and project activity streams.

---

## Prerequisites

- **Node.js**: v20+ and npm v10+
- **Java**: OpenJDK 21 or Java 25
- **MongoDB**: Active MongoDB instance or MongoDB Atlas cluster
- **E2B Account**: Free API key from [e2b.dev](https://e2b.dev)
- **Liveblocks Account**: Secret key from [liveblocks.io](https://liveblocks.io)

---

## Configuration & Environment Variables

Copy the respective template in each directory and supply values:

| Component | Example File | Configuration Target |
| :--- | :--- | :--- |
| Runner | `runner/.env.example` | `runner/.env` |
| Backend | `backend/.env.example` | `backend/.env` |
| Frontend | `frontend/.env.example` | `frontend/.env` |

### Critical Environment Variable Alignment

> [!IMPORTANT]
> `RUNNER_TOKEN` in `runner/.env` and `APP_EXECUTION_SERVICE_TOKEN` in `backend/.env` **must match identically** and must be at least 32 characters long. The runner service will fail closed on startup if the token is missing or too short, and the backend will refuse execution requests if unset.

### Environment Variable Reference

| Variable | Service | Required | Description |
| :--- | :--- | :--- | :--- |
| `E2B_API_KEY` | Runner | Yes | API key from e2b.dev for cloud sandboxes |
| `RUNNER_TOKEN` | Runner | Yes | Shared secret for runner authentication (min 32 chars) |
| `HOST` | Runner | No | Host bind address (defaults to `127.0.0.1`) |
| `PORT` | Runner | No | Runner HTTP port (defaults to `4000`) |
| `APP_EXECUTION_SERVICE_URL` | Backend | Yes | URL to runner service (`http://localhost:4000`) |
| `APP_EXECUTION_SERVICE_TOKEN` | Backend | Yes | **Must match `RUNNER_TOKEN`** (min 32 chars) |
| `MONGODB_USERNAME` | Backend | Yes | MongoDB authentication username |
| `MONGODB_PASSWORD` | Backend | Yes | MongoDB authentication password |
| `JWT_SECRET` | Backend | Yes | Secret string (min 256 bits) for HMAC signing |
| `LIVEBLOCKS_SECRET_KEY` | Backend | Yes | Secret key from Liveblocks dashboard |
| `GOOGLE_CLIENT_ID` / `_SECRET` | Backend | Optional | Google OAuth2 credentials |
| `GITHUB_CLIENT_ID` / `_SECRET` | Backend | Optional | GitHub OAuth2 credentials |
| `VITE_API_URL` | Frontend | Yes | Base URL to Spring Boot backend (`http://localhost:8080`) |

---

## Three-Process Startup Order

To start Confluo locally, run the three services in the following order across separate terminal tabs or windows:

### 1. Runner Service (Terminal 1)

```bash
cd runner
npm install
npm start
```
*Health check*: `curl http://127.0.0.1:4000/health` (returns `{"status":"ok"}`).

### 2. Spring Boot Backend (Terminal 2)

```bash
cd backend
# Linux / macOS:
./mvnw spring-boot:run
# Windows PowerShell / CMD:
.\mvnw.cmd spring-boot:run
```
*Health check*: Server listens on `http://localhost:8080`.

### 3. Frontend Dev Server (Terminal 3)

```bash
cd frontend
npm install
npm run dev
```
*Access*: Open `http://localhost:5173` in your browser.

---

## Testing & Quality Checks

Run test suites and verification commands across the monorepo:

```bash
# Runner tests and typecheck:
npm --prefix runner test
npm --prefix runner run typecheck

# Backend tests:
cd backend && ./mvnw test

# Frontend build, lint, and test suite:
npm --prefix frontend run build
npm --prefix frontend run lint
npm --prefix frontend test
```

---

## Troubleshooting Guide

### 1. Runner Startup Failure: `RUNNER_TOKEN must be configured with at least 32 characters`
- **Cause**: `RUNNER_TOKEN` is missing, blank, or shorter than 32 characters in `runner/.env`.
- **Solution**: Generate a random 32+ character string (e.g. `openssl rand -hex 24`) and place it in `runner/.env` and as `APP_EXECUTION_SERVICE_TOKEN` in `backend/.env`.

### 2. Execution Request Returns HTTP 503: `Code execution authentication is not configured`
- **Cause**: Backend was started without `APP_EXECUTION_SERVICE_TOKEN` or `application.properties` default was omitted.
- **Solution**: Set `APP_EXECUTION_SERVICE_TOKEN` in `backend/.env` matching the runner's `RUNNER_TOKEN`.

### 3. Execution Request Returns HTTP 401: `Unauthorized: Invalid or missing execution token`
- **Cause**: `APP_EXECUTION_SERVICE_TOKEN` sent by backend does not match `RUNNER_TOKEN` expected by runner.
- **Solution**: Compare the two values in your `.env` files and restart both services.

### 4. Runner Returns HTTP 429: `Runner concurrency limit reached`
- **Cause**: More than 2 concurrent code executions were attempted simultaneously.
- **Solution**: Wait for active sandbox executions to finish or raise `MAX_CONCURRENT_EXECUTIONS` in `runner/src/index.ts` if capacity permits.

### 5. MongoDB Connection Failure
- **Cause**: Incorrect username/password or IP address not whitelisted in MongoDB Atlas Network Access.
- **Solution**: Verify credentials in `backend/.env` and ensure your current IP is allowed in MongoDB Atlas.

### 6. Liveblocks Disconnection / Offline Banner
- **Cause**: Invalid `LIVEBLOCKS_SECRET_KEY` on backend or network interruption.
- **Solution**: Ensure your Liveblocks secret key begins with `sk_` and check browser console network calls to `/api/liveblocks-auth`.
