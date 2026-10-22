# Code execution service

Confluo does not execute source code on the Spring Boot host. The Run action
posts the authenticated project's current Yjs snapshot to an isolated execution
service through:

```text
POST {APP_EXECUTION_SERVICE_URL}/v1/execute
X-Confluo-Project: <validated project id>
Content-Type: application/json
```

The request contains `language`, a relative `entrypoint`, and text `files`.
The service must return JSON with `stdout`, `stderr`, `exitCode`, and
`timedOut`.

## Required execution-service properties

The service must:

- authenticate requests from the backend, not from the browser;
- use an allowlisted Java, Node.js/TypeScript, Python, C, and C++ runtime image;
- create an ephemeral, non-privileged workspace for each request;
- reject absolute paths and traversal, and never mount the application host;
- enforce CPU, memory, disk, process-count, network, and wall-clock limits;
- clean up the workspace after success, failure, timeout, or disconnect;
- return compilation errors and process exit status without exposing secrets.

Set `APP_EXECUTION_SERVICE_URL` only to a private service endpoint reachable by
the backend. If it is absent, the API returns `503 Service Unavailable` rather
than falling back to unsafe host execution. The current repository does not
include or deploy that isolated service, so end-to-end Run validation requires
deploying it separately with authenticated service-to-service networking.

The frontend and backend still require the existing `VITE_API_URL`, MongoDB,
JWT, OAuth, and Liveblocks configuration documented by the deployment
environment.

## PDF assets

PDF files are stored as binary objects in MongoDB GridFS. Only the asset
metadata (`assetId`, MIME type, and size) is synchronized in the shared Yjs
tree; PDF bytes are never placed in Y.Text or Liveblocks updates. The
project-scoped asset endpoints require the same authenticated project access
checks as the rest of the API:

```text
POST   /api/projects/{projectId}/assets       multipart field: file
GET    /api/projects/{projectId}/assets/{id}
DELETE /api/projects/{projectId}/assets/{id}
```

Uploads require project edit access and are limited to PDF files. Viewers can
download assets when they belong to the project, but cannot upload or delete
them. MongoDB must provide GridFS collections and enough storage for project
assets. The default per-request upload limit is 25 MB; production deployments
should also enforce project-level quotas and an asset cleanup policy for
replaced or deleted shared nodes.
