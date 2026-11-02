# Real-Time Collaborative Cloud IDE & Multi-Language Execution Platform

> A modern, browser-based collaborative software development environment featuring real-time multiplayer code editing, synchronized presence, live inline code comments, project chat, integrated VS Code-style terminal, sandboxed multi-language execution, and live browser previews.

---

## Architecture Overview

```
                               +----------------------------------+
                               |     Browser / React Client       |
                               |  (Vite + React 19 + TypeScript)  |
                               +-----------------+----------------+
                                                 |
                       +-------------------------+-------------------------+
                       | HTTP / REST API                                   | WebSocket Connection
                       v                                                   v
        +-------------------------------+                   +-------------------------------+
        |      Spring Boot Backend      |                   |       Liveblocks Cloud        |
        |   (Java 25 + Spring Security) |                   |    (Yjs CRDT Realtime Sync)   |
        +---------------+---------------+                   +-------------------------------+
                        |
            +-----------+-----------+
            | Token-Secured HTTP    | MongoDB Atlas Driver
            v                       v
+-----------------------+   +-----------------------+
|    Node.js Runner     |   |     MongoDB Store     |
| (E2B Cloud Sandboxes) |   | (Users, Projects,     |
+-----------------------+   |  Chat, Activities)    |
                            +-----------------------+
```

### System Components

- **Frontend (`frontend/`)**: React 19 single-page application built with TypeScript, Vite, Monaco Editor, Tailwind CSS, and Lucide React. Implements a responsive dark-first editorial aesthetic with fluid collaborator presence, live cursor tracking, inline threads, and VS Code-inspired docking panels.
- **Backend (`backend/`)**: Spring Boot microservice written in Java 25 utilizing Spring Security, JWT authentication, OAuth2 integrations (Google & GitHub), and Spring Data MongoDB for persistence and access delegation.
- **Execution Runner (`runner/`)**: High-performance Node.js & Express service running isolated multi-language code jobs inside hardware-virtualized micro-VM cloud sandboxes powered by E2B.
- **Real-Time Layer**: Liveblocks Yjs provider facilitating conflict-free replicated data type (CRDT) document synchronization, collaborator awareness, cursor positions, and room presence.
- **Data Persistence**: MongoDB database storing user credentials, workspace metadata, project memberships, chat messages, and event audit trails.

---

## Core Features

- **Multi-User Synchronized Editing**: Conflict-free real-time typing across multiple tabs and users powered by Monaco Editor and Yjs CRDTs.
- **Live Collaborator Cursors & Presence**: Real-time cursor coordinates, live selection highlights with labeled collaborator tags, and active file badges.
- **Inline Code Comments & Notification Inbox**: Clickable gutter comment markers, inline review threads, resolved status toggles, and notification tray.
- **VS Code-Inspired Terminal & Virtual Shell**: Fully interactive shell supporting standard commands (`cd`, `pwd`, `ls`, `cat`, `mkdir`, `touch`, `clear`), terminal height dragging, keyboard navigation, maximization, and direct execution via `run <filename>`.
- **Isolated Cloud Execution (E2B Sandboxes)**: Ephemeral micro-VM code execution supporting Python, JavaScript, TypeScript, C, C++, Java, Rust, Go, PHP, Ruby, and SQL with real-time stdout/stderr streaming.
- **Context-Aware Intelligent Suggestions**: Real-time language completions in Monaco triggering on incomplete keywords, identifiers, variables, and methods.
- **Live HTML/CSS Inbuilt Browser Preview**: Instant sandboxed preview iframe with URL address bar, refresh control, popout window, and real-time DOM synchronization.
- **Monochrome Dark Theme & IDE Customization**: Sleek black, white, and grey color tokens, selectable Monaco color themes (Dark+, GitHub Dark, One Dark, Dracula, Light+), customizable font sizes, tab indentation, minimap controls, and accessibility settings.
- **Profile & Identity Management**: Real-time display name customization, provider details, and verified collaborator avatars.
- **Project Membership & Access Control**: Role-based permissions (`OWNER`, `EDITOR`, `VIEWER`) and dynamic member rosters.
- **Team Chat & Activity Audit Feed**: In-editor team messaging and chronological project event stream with pagination and retry handling.

---

## Complete Workflow & Data Flow

```
[ User Action ]
      │
      ├── 1. Authentication & Session Initialization
      │       ├── User registers or signs in (Email/Password, Google, or GitHub).
      │       ├── Backend validates credentials and issues signed HMAC-SHA256 JWT.
      │       └── Client attaches Bearer token to all future REST requests.
      │
      ├── 2. Workspace Access & Live Room Connection
      │       ├── User opens project workspace (/project/:id).
      │       ├── Frontend requests ephemeral Liveblocks room token from /api/liveblocks-auth.
      │       ├── Backend verifies project membership role (OWNER, EDITOR, VIEWER).
      │       └── Client establishes secure WebSocket connection to sync room state.
      │
      ├── 3. Real-Time Collaborative Editing & Presence
      │       ├── Keystrokes in Monaco update the shared Yjs document model.
      │       ├── CRDT updates propagate peer-to-peer via Liveblocks WebSockets.
      │       └── Mouse movements and editor selections broadcast live cursor flags and tags.
      │
      ├── 4. Code Execution & Shell Interaction
      │       ├── User clicks "Run" or enters "run main.py" in the integrated terminal.
      │       ├── Frontend dispatches POST /api/projects/:id/execute with file content.
      │       ├── Backend validates rate limits, checks role, and forwards to Runner service.
      │       ├── Runner provisions an isolated E2B micro-VM sandbox.
      │       ├── Runner compiles (if needed), executes, and captures exit codes & outputs.
      │       └── Process output streams back to the frontend virtual terminal window.
      │
      └── 5. Live Inbuilt Browser Preview
              ├── User selects an HTML file in the workspace explorer.
              ├── "Preview" action mounts the sandboxed preview panel.
              └── Client resolves local scripts/stylesheets and renders through isolated iframe.
```

---

## Tech Stack

| Domain | Technology / Library | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19, TypeScript | Reactive user interface & component state |
| **Build & Bundler** | Vite, Rollup | Fast HMR dev server & optimized production bundling |
| **Code Editor** | Monaco Editor (`@monaco-editor/react`) | Industry-standard code editor with syntax highlighting |
| **Styling & Icons** | Tailwind CSS, Lucide React | Modern dark aesthetic & technical iconography |
| **Realtime Sync** | Yjs, Liveblocks (`@liveblocks/client`, `@liveblocks/react`) | CRDT synchronization & presence coordination |
| **Backend Framework** | Spring Boot 4, Java 25 | REST API, access control, and orchestration |
| **Security & Auth** | Spring Security, JJWT, OAuth2 Client | Stateless JWT verification & third-party identity |
| **Database & ODM** | MongoDB Atlas / Community, Spring Data MongoDB | Document persistence for users, projects, and logs |
| **Execution Service** | Node.js, Express, TypeScript | Dedicated execution gateway |
| **Cloud Sandboxes** | E2B Cloud Sandboxes (`@e2b/code-interpreter`) | Hardware-isolated micro-VM code execution |
| **Testing** | Vitest, Testing Library, JUnit 5, Mockito | Comprehensive unit and integration test coverage |

---

## Directory Structure

```
├── backend/                  # Spring Boot Java 25 REST Application
│   ├── src/main/java/        # Controllers, Services, DTOs, Security filters
│   ├── src/main/resources/   # application.properties & configuration templates
│   ├── src/test/java/        # JUnit & Mockito integration and unit test suites
│   ├── pom.xml               # Maven project object model and dependencies
│   └── mvnw / mvnw.cmd       # Maven wrappers for Linux/macOS and Windows
│
├── frontend/                 # Vite + React 19 Single Page Application
│   ├── src/
│   │   ├── api/              # Strongly-typed fetch clients for REST endpoints
│   │   ├── auth/             # Authentication context, session tokens & hooks
│   │   ├── chat/             # Real-time project chat & activity feed components
│   │   ├── collaborative/    # Live cursor trackers, presence badges, avatar stacks
│   │   ├── comments/         # Monaco gutter markers, inline threads, notification popover
│   │   ├── components/       # Shared UI components (avatars, error boundaries, shell)
│   │   ├── landing/          # Interactive marketing homepage & narrative scroll sections
│   │   ├── pages/            # Home dashboard, workspace IDE view, auth screens
│   │   ├── preview/          # Inbuilt browser preview with sandboxed iframe resolver
│   │   ├── settings/         # Workspace preferences, theme presets, profile manager
│   │   ├── terminal/         # VS Code-inspired virtual terminal & Linux command shell
│   │   └── workspace/        # Tree explorer, file icons, context menus, completions
│   ├── package.json          # Frontend scripts and dependencies
│   └── vite.config.ts        # Vite configuration and plugins
│
├── runner/                   # Node.js + Express Execution Microservice
│   ├── src/
│   │   ├── index.ts          # Express server with token authentication & E2B runner
│   │   └── index.test.ts     # Execution tests & concurrency validation
│   ├── package.json          # Runner scripts and dependencies
│   └── tsconfig.json         # TypeScript configuration
│
├── scripts/                  # Operational scripts & preflight validation
│   └── preflight.ps1         # Environment verification and diagnostic utility
│
└── docs/                     # Architectural & security documentation
    └── SECURITY.md           # Security design principles and defense-in-depth model
```

---

## Prerequisites

Before setting up the environment locally, ensure you have:

- **Node.js**: v20+ and npm v10+
- **Java Development Kit**: OpenJDK 21 or Java 25
- **MongoDB**: Local MongoDB instance (`mongodb://localhost:27017`) or free MongoDB Atlas URI
- **E2B Account**: Free API key from [e2b.dev](https://e2b.dev) (for sandbox execution)
- **Liveblocks Account**: Secret key (`sk_...`) from [liveblocks.io](https://liveblocks.io) (for realtime collaboration)

---

## Environment Configuration

Configure the `.env` file in each respective service directory prior to running:

### 1. Runner Configuration (`runner/.env`)

```ini
PORT=4000
HOST=127.0.0.1
E2B_API_KEY=your_e2b_api_key_here
# Shared execution token - must be at least 32 characters
RUNNER_TOKEN=generate_random_secret_string_minimum_32_characters_here
```

### 2. Backend Configuration (`backend/.env`)

```ini
SERVER_PORT=8080
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/platform_db?retryWrites=true&w=majority
MONGODB_DATABASE=platform_db

# Security & Authentication
JWT_SECRET=your_base64_or_hex_encoded_secret_minimum_256_bits_length_here
LIVEBLOCKS_SECRET_KEY=sk_your_liveblocks_secret_key_here

# Execution Runner Link (Must match RUNNER_TOKEN identically)
APP_EXECUTION_SERVICE_URL=http://localhost:4000
APP_EXECUTION_SERVICE_TOKEN=generate_random_secret_string_minimum_32_characters_here

# Optional: OAuth Providers
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

### 3. Frontend Configuration (`frontend/.env`)

```ini
VITE_API_URL=http://localhost:8080
```

> [!IMPORTANT]
> **Token Alignment**: `RUNNER_TOKEN` in `runner/.env` and `APP_EXECUTION_SERVICE_TOKEN` in `backend/.env` **must match identically**. Both services validate this shared secret on every code execution invocation.

---

## Running the Application Locally

Start all three services across separate terminal sessions:

### Step 1: Start the Execution Runner

```bash
cd runner
npm install
npm start
```
*Verification*: Check `http://127.0.0.1:4000/health` (should respond with `{"status":"ok"}`).

### Step 2: Start the Spring Boot Backend

```bash
cd backend

# On Linux / macOS:
./mvnw spring-boot:run

# On Windows (PowerShell / Command Prompt):
.\mvnw.cmd spring-boot:run
```
*Verification*: Backend will initialize on `http://localhost:8080`.

### Step 3: Start the Frontend Client

```bash
cd frontend
npm install
npm run dev
```
*Access*: Open `http://localhost:5173` in your browser.

---

## Automated Verification & Preflight Checks

A preflight diagnostic script is provided to verify environment variables, service connectivity, and credentials before launching:

```powershell
# Run system diagnostics
powershell -ExecutionPolicy Bypass -File scripts/preflight.ps1
```

---

## Quality Assurance & Testing

Run the test suites across each tier to ensure system integrity:

```bash
# 1. Frontend Test Suite & Static Analysis
npm --prefix frontend test           # Runs all 53 test suites (457 tests) via Vitest
npx --prefix frontend oxlint         # Runs high-performance linter
npm --prefix frontend run build      # Verifies TypeScript types & generates production bundle

# 2. Backend Integration & Unit Tests
cd backend && ./mvnw test            # Runs JUnit 5 & Mockito test suites

# 3. Execution Runner Tests
npm --prefix runner test             # Tests sandbox endpoints & security middleware
npm --prefix runner run typecheck    # Verifies TypeScript compiler integrity
```

---

## Supported Programming Languages for Execution

The platform automatically identifies the file type and routes code execution to the cloud sandbox runtime:

| Language | Extension | Execution Command in Sandbox |
| :--- | :--- | :--- |
| **Python** | `.py` | `python3 <filename>` |
| **JavaScript** | `.js`, `.mjs` | `node <filename>` |
| **TypeScript** | `.ts` | `npx tsx <filename>` |
| **C** | `.c` | `gcc <filename> -o a.out && ./a.out` |
| **C++** | `.cpp`, `.cc` | `g++ <filename> -o a.out && ./a.out` |
| **Java** | `.java` | `javac <filename> && java <ClassName>` |
| **Rust** | `.rs` | `rustc <filename> -o a.out && ./a.out` |
| **Go** | `.go` | `go run <filename>` |
| **PHP** | `.php` | `php <filename>` |
| **Ruby** | `.rb` | `ruby <filename>` |
| **SQL** | `.sql` | `sqlite3 :memory: < <filename>` |
| **HTML / Web** | `.html` | Rendered directly inside Sandboxed Inbuilt Browser |

---

## Troubleshooting Guide

| Issue | Root Cause | Resolution |
| :--- | :--- | :--- |
| **Runner fails on startup** (`RUNNER_TOKEN must be configured with at least 32 characters`) | `RUNNER_TOKEN` is unset or shorter than 32 characters. | Supply a random 32+ character string in `runner/.env` and update `APP_EXECUTION_SERVICE_TOKEN` in `backend/.env`. |
| **HTTP 503 on execution** (`Code execution authentication is not configured`) | Backend has no `APP_EXECUTION_SERVICE_TOKEN` set. | Set `APP_EXECUTION_SERVICE_TOKEN` in `backend/.env` and restart the backend. |
| **HTTP 401 on execution** (`Unauthorized: Invalid or missing execution token`) | Token mismatch between backend and runner. | Ensure `APP_EXECUTION_SERVICE_TOKEN` exactly equals `RUNNER_TOKEN`. |
| **HTTP 429 on execution** (`Runner concurrency limit reached`) | More than 2 concurrent code executions in progress. | Wait for existing jobs to complete or adjust concurrency limits in `runner/src/index.ts`. |
| **MongoDB connection timeout** | Network IP not whitelisted or credentials invalid. | Verify MongoDB Atlas network security settings and verify credentials in `backend/.env`. |
| **Liveblocks offline banner in editor** | Invalid `LIVEBLOCKS_SECRET_KEY` or missing room token. | Confirm the secret key begins with `sk_` in `backend/.env` and inspect the network call to `/api/liveblocks-auth`. |
