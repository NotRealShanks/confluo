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
