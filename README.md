# Collaborative Cloud IDE & Multi-Language Execution Platform

> A full-featured, browser-based collaborative software development environment featuring real-time multiplayer code editing, synchronized cursor presence, inline code review comments, project chat, integrated VS Code-style terminal, sandboxed multi-language cloud execution (E2B), browser preview, and crash-resilient auto-recovery.

---

## Architecture Overview

```
                                +----------------------------------+
                                |      Browser / React Client      |
                                |  (Vite + React 19 + TypeScript)  |
                                +-----------------+----------------+
                                                  |
                        +-------------------------+-------------------------+
                        | HTTPS / REST API                                  | WSS (Secure WebSocket)
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
 +-----------------------+   |  Chat, Drafts, Audit) |
                             +-----------------------+
```

### System Components

- **Frontend (`frontend/`)**: React 19 single-page application built with TypeScript, Vite, Monaco Editor, Tailwind CSS, and Lucide React. Features a dark-first editorial interface, multi-file tabs, live collaborator presence, inline code comment markers, interactive terminal docks, and sandboxed browser preview.
- **Backend (`backend/`)**: Spring Boot microservice written in Java 25 utilizing Spring Security, stateless JWT authentication, OAuth2 integrations (Google & GitHub), reverse-proxy forward header support, and Spring Data MongoDB.
- **Execution Runner (`runner/`)**: High-performance Node.js & Express service running isolated multi-language code jobs inside hardware-virtualized micro-VM cloud sandboxes powered by [E2B](https://e2b.dev).
- **Real-Time Collaboration**: Liveblocks Yjs provider facilitating conflict-free replicated data type (CRDT) document synchronization, awareness states, collaborator cursor coordinates, and room presence.
- **Crash Resilience & Auto-Recovery**: Client-side IndexedDB caching coupled with backend draft endpoints to automatically capture unsaved edits and restore workspace state across unexpected network drops or browser crashes.
- **Data Persistence**: MongoDB Atlas storing user identities, workspace metadata, project memberships, chat messages, and event audit trails.

---

## Core Features

- **Multi-User Realtime Editing**: Conflict-free concurrent editing powered by Monaco Editor and Yjs CRDTs with instant synchronization across clients.
- **Collaborator Presence & Cursors**: Real-time cursor coordinates, labeled collaborator flags, active file badges, and dynamic collaborator avatar rosters.
- **Inline Code Comments & Notification Inbox**: Clickable gutter comment markers, inline review threads, resolved status toggles, and notification tray.
- **VS Code-Inspired Terminal & Virtual Shell**: Interactive shell supporting standard utilities (`g++`, `gcc`, `python`, `node`, `ls`, `cd`, `cat`, `mkdir`, `touch`, `clear`), multi-tab terminal management, terminal height adjustment, and command history navigation.
- **Hardware-Isolated Cloud Execution (E2B)**: Ephemeral micro-VM code execution supporting Python, JavaScript, TypeScript, C, C++, Java, Rust, Go, PHP, Ruby, and SQL with real-time output capture and error diagnostics.
- **Live Inbuilt Browser Preview**: Instant preview iframe with URL address bar, refresh control, popout window, and real-time DOM synchronization for HTML/CSS/JS development.
- **Intelligent Autocompletions**: Real-time context-aware Monaco suggestions for keywords, identifiers, variables, and methods.
- **Crash Recovery & Draft Persistence**: Automatic local IndexedDB and server-side draft backups protecting your code from accidental page reloads or network drops.
- **Project Membership & Access Control**: Role-based permissions (`OWNER`, `EDITOR`, `VIEWER`) and dynamic member rosters.
- **Team Chat & Activity Audit Feed**: In-editor team messaging and chronological project event stream with pagination and retry handling.

---

## Tech Stack

| Domain | Technology / Library | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19, TypeScript | Reactive user interface & component state |
| **Build & Bundler** | Vite, Rollup | High-speed HMR dev server & production bundling |
| **Code Editor** | Monaco Editor (`@monaco-editor/react`) | Full-featured code editor with syntax highlighting |
| **Styling & Icons** | Tailwind CSS, Lucide React | Modern dark aesthetic & technical iconography |
| **Realtime Sync** | Yjs, Liveblocks (`@liveblocks/client`, `@liveblocks/react`) | CRDT synchronization & presence coordination |
| **Backend Framework** | Spring Boot 4, Java 25 | REST API, access control, and orchestration |
| **Security & Auth** | Spring Security, JJWT, OAuth2 Client | Stateless JWT verification & Google/GitHub OAuth |
| **Database & ODM** | MongoDB Atlas, Spring Data MongoDB | Document persistence for users, projects, and logs |
| **Execution Microservice** | Node.js, Express, TypeScript | Cloud sandbox execution gateway |
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
│   │   ├── comments/         # Monaco gutter markers, inline threads, notifications
│   │   ├── components/       # Shared UI components (avatars, error boundaries, shell)
│   │   ├── landing/          # Interactive marketing homepage & narrative sections
│   │   ├── pages/            # Home dashboard, workspace IDE view, auth screens
│   │   ├── preview/          # Inbuilt browser preview with sandboxed iframe resolver
│   │   ├── recovery/         # Client-side IndexedDB draft auto-recovery hooks
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
│   ├── Dockerfile            # Container build specification
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

## Deployment Guide (Production)

The platform is designed to be easily deployed across modern serverless and cloud hosting providers:

### Architecture Matrix

| Service | Recommended Host | Production URL Pattern | Root Directory |
| :--- | :--- | :--- | :--- |
| **Frontend** | [Vercel](https://vercel.com) | `https://<app-name>.vercel.app` | `/frontend` |
| **Backend** | [Railway](https://railway.com) / Render | `https://<backend-name>.up.railway.app` | `/backend` |
| **Execution Runner** | [Railway](https://railway.com) / Render | `https://<runner-name>.up.railway.app` | `/runner` |

---

### Step-by-Step Production Setup

#### 1. Frontend on Vercel
1. Import your GitHub repository into Vercel.
2. Set **Root Directory** to `frontend`.
3. Set **Framework Preset** to `Vite`.
4. Configure Environment Variables:
   - `VITE_API_URL`: Your deployed backend URL (e.g., `https://backend-production.up.railway.app` - no trailing slash).
5. Click **Deploy**.

#### 2. Backend on Railway
1. Create a new project on Railway and connect your GitHub repository.
2. In service **Settings**:
   - Set **Root Directory** to `/backend`.
   - Under **Networking**, click **Generate Domain** (e.g., `https://backend-production.up.railway.app`).
3. In service **Variables**, configure:
   ```env
   PORT=8080
   MONGODB_USERNAME=your_mongodb_username
   MONGODB_PASSWORD=your_mongodb_password
   JWT_SECRET=your_minimum_256_bit_random_secret
   LIVEBLOCKS_SECRET_KEY=sk_your_liveblocks_secret_key
   APP_FRONTEND_URL=https://your-frontend.vercel.app
   APP_EXECUTION_SERVICE_URL=https://your-runner.up.railway.app
   APP_EXECUTION_SERVICE_TOKEN=your_32_character_shared_token
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   ```

#### 3. Execution Runner on Railway
1. In the **same Railway project**, click **+ New** $\rightarrow$ **GitHub Repo** $\rightarrow$ select the same repo.
2. In service **Settings**:
   - Rename service to `runner`.
   - Set **Root Directory** to `/runner`.
   - Under **Networking**, click **Generate Domain** (copy this URL for `APP_EXECUTION_SERVICE_URL` in backend).
3. In service **Variables**, configure:
   ```env
   PORT=4000
   HOST=0.0.0.0
   NODE_ENV=production
   RUNNER_TOKEN=your_32_character_shared_token
   E2B_API_KEY=your_e2b_api_key
   ```

#### 4. OAuth Provider Callbacks
Register the following Authorized Redirect URIs in your developer consoles:
- **Google Cloud Console** $\rightarrow$ APIs & Services $\rightarrow$ Credentials:
  - `https://<backend-domain>/login/oauth2/code/google`
  - `http://localhost:8080/login/oauth2/code/google` (for local dev)
- **GitHub Developer Settings** $\rightarrow$ OAuth Apps:
  - `https://<backend-domain>/login/oauth2/code/github`
  - `http://localhost:8080/login/oauth2/code/github` (for local dev)

---

## Local Development Setup

### Prerequisites

- **Node.js**: v20+ and npm v10+
- **Java Development Kit**: OpenJDK 21 or Java 25
- **MongoDB**: Local MongoDB instance (`mongodb://localhost:27017`) or free MongoDB Atlas URI
- **E2B Account**: Free API key from [e2b.dev](https://e2b.dev) (for sandbox execution)
- **Liveblocks Account**: Secret key (`sk_...`) from [liveblocks.io](https://liveblocks.io) (for realtime collaboration)

### Environment Files

#### Runner (`runner/.env`)
```ini
PORT=4000
HOST=127.0.0.1
E2B_API_KEY=your_e2b_api_key_here
RUNNER_TOKEN=generate_random_secret_string_minimum_32_characters_here
NODE_ENV=development
```

#### Backend (`backend/.env`)
```ini
SERVER_PORT=8080
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/platform_db?retryWrites=true&w=majority
MONGODB_DATABASE=platform_db
JWT_SECRET=your_minimum_256_bit_random_secret
LIVEBLOCKS_SECRET_KEY=sk_your_liveblocks_secret_key
APP_FRONTEND_URL=http://localhost:5173
APP_EXECUTION_SERVICE_URL=http://localhost:4000
APP_EXECUTION_SERVICE_TOKEN=generate_random_secret_string_minimum_32_characters_here
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

#### Frontend (`frontend/.env`)
```ini
VITE_API_URL=http://localhost:8080
```

> [!IMPORTANT]
> **Token Matching**: `RUNNER_TOKEN` in `runner/.env` and `APP_EXECUTION_SERVICE_TOKEN` in `backend/.env` must match identically.

---

### Starting Services Locally

```bash
# Terminal 1: Start Execution Runner
cd runner
npm install
npm start

# Terminal 2: Start Spring Boot Backend
cd backend
./mvnw spring-boot:run          # Linux/macOS
.\mvnw.cmd spring-boot:run      # Windows

# Terminal 3: Start Frontend Client
cd frontend
npm install
npm run dev
```

Open **`http://localhost:5173`** in your browser.

---

## Supported Programming Languages for Execution

The platform automatically identifies the file type and routes code execution to the cloud sandbox runtime:

| Language | Extension | Execution Command in Sandbox |
| :--- | :--- | :--- |
| **C++** | `.cpp`, `.cc` | `g++ <filename> -o a.out && ./a.out` |
| **C** | `.c` | `gcc <filename> -o a.out && ./a.out` |
| **Python** | `.py` | `python3 <filename>` |
| **JavaScript** | `.js`, `.mjs` | `node <filename>` |
| **TypeScript** | `.ts` | `npx tsx <filename>` |
| **Java** | `.java` | `javac <filename> && java <ClassName>` |
| **Rust** | `.rs` | `rustc <filename> -o a.out && ./a.out` |
| **Go** | `.go` | `go run <filename>` |
| **PHP** | `.php` | `php <filename>` |
| **Ruby** | `.rb` | `ruby <filename>` |
| **SQL** | `.sql` | `sqlite3 :memory: < <filename>` |
| **HTML / CSS / JS** | `.html` | Rendered live inside Inbuilt Sandboxed Browser |

---

## Quality Assurance & Testing

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

## Troubleshooting Guide

| Issue | Root Cause | Resolution |
| :--- | :--- | :--- |
| **Google `redirect_uri_mismatch` or GitHub callback error** | Reverse proxy SSL termination caused Spring to send `http://` callback. | Ensure `server.forward-headers-strategy=framework` is set in `application.properties` and your redirect URI in Google/GitHub matches your HTTPS production domain. |
| **`Execution runner returned an error: Bad Gateway`** | Backend cannot reach the runner microservice (e.g. `APP_EXECUTION_SERVICE_URL` still points to `localhost:4000`). | Deploy the `runner` microservice to Railway/Render, set its `HOST=0.0.0.0`, and update `APP_EXECUTION_SERVICE_URL` in the backend environment variables with the runner's URL. |
| **HTTP 503 on execution** (`Code execution authentication is not configured`) | Backend has no `APP_EXECUTION_SERVICE_TOKEN` set. | Set `APP_EXECUTION_SERVICE_TOKEN` in backend environment variables and restart. |
| **HTTP 401 on execution** (`Unauthorized: Invalid or missing execution token`) | Secret mismatch between backend and runner. | Ensure `APP_EXECUTION_SERVICE_TOKEN` exactly equals `RUNNER_TOKEN`. |
| **HTTP 429 on execution** (`Runner concurrency limit reached`) | More than 2 concurrent code executions in progress. | Wait for existing jobs to complete or adjust concurrency limits in `runner/src/index.ts`. |
| **MongoDB connection timeout** | Network IP not whitelisted or credentials invalid. | Allow `0.0.0.0/0` in MongoDB Atlas Network Access rules and verify credentials in backend configuration. |
| **Liveblocks offline banner in editor** | Invalid `LIVEBLOCKS_SECRET_KEY` or missing room token. | Confirm the secret key begins with `sk_` in backend configuration and inspect the network response of `/api/liveblocks-auth`. |
