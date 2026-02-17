# Backend logging plan

## How logs are printed to the console

- **Single logger**: All application logging goes through the Winston-based logger in `src/core/utils/logger.js`. Use it via `const logger = require('./core/utils/logger')` (or the relative path from your file).
- **Console output**: The logger always has a **Console** transport. In development it uses a human-readable, colorized format; in production it uses JSON. No separate `console.log` is needed for request/response or app flow.
- **Level**: Controlled by `LOG_LEVEL` (env). Default: `debug` in development, `info` in production. Use `logger.debug()`, `logger.info()`, `logger.warn()`, `logger.error()` as appropriate.
- **Request/response**: The **request logger middleware** (`requestLoggerMiddleware`) already logs every incoming request and, when the response is sent, logs method, path, status code, duration, and request ID. Do not add extra response-phase logging in `server.js` that calls undefined helpers (see below).

## Rules (to avoid crashes and keep logging consistent)

1. **Do not add `DEBUG_LOG` or ad-hoc logging in `server.js`**  
   Past crashes were caused by:
   - Defining `DEBUG_LOG` in one place and removing it later, while leaving `res.on('finish', ...)` (or similar) still calling `DEBUG_LOG`. When the response finished, the app called an undefined function and crashed.
   - Any `#region agent log`-style blocks that call a custom debug function from response lifecycle (e.g. on `finish`) must not be added unless that function is always defined and safe (no I/O that can throw).

2. **Use only the project logger for app logs**  
   Use `logger.info()`, `logger.warn()`, `logger.error()`, `logger.debug()` (and `logger.logRequest` / `logger.logError` where applicable). Avoid `console.log` for request/response or business flow so that level and format stay consistent and logs can be centralized later (e.g. ELK, DataDog).

3. **Response-phase code in `server.js`**  
   If you add middleware that runs on `res.on('finish')` or inside `res.end`, ensure it never calls undefined functions and never throws (or wrap in try/catch and log via `logger.error`). Prefer the existing request logger middleware for request/response logging instead of adding new response-phase hooks in `server.js`.

## Summary

| Where to log      | How                                      |
|-------------------|------------------------------------------|
| Console output    | Winston logger → Console transport        |
| Request/response  | `requestLoggerMiddleware` (already in use)|
| Ad-hoc debug      | `logger.debug()` (no DEBUG_LOG in server.js) |
| Errors            | `logger.error()` / `logger.logError()`   |

This avoids the “crash when delivering output” caused by calling undefined `DEBUG_LOG` on response finish and keeps logging consistent and safe.

---

## Minimal server log styles

When you want **less noise** in the console, use one of these styles. Control is via environment variables.

### Style 1: One line per request (recommended minimal)

- **Env:** `REQUEST_LOG=minimal`
- **Behavior:** No "Incoming request" log. When the response finishes, a **single line** is logged: method, path, status code, duration. Health checks (`/health`, `/health/ready`, `/health/db`) are not logged.
- **Example:** `GET /api/v1/dashboard 200 42ms`
- **Use case:** Default for dev/prod when you want a quiet console but still see traffic.

### Style 2: Errors and slow only

- **Env:** `REQUEST_LOG=errors` (optional future)
- **Behavior:** Log only when status >= 400 or duration > threshold (e.g. 2s). One line per such request.
- **Use case:** Very quiet; only problems or slow requests appear.

### Style 3: Full (current default)

- **Env:** `REQUEST_LOG=full` or unset
- **Behavior:** Two lines per request (incoming + response with full meta: requestId, method, path, status, duration, userId). All routes logged.
- **Use case:** Debugging, audit, or when you need request IDs in every log.

### Style 4: Startup minimal

- **Env:** `STARTUP_LOG=minimal` (optional future)
- **Behavior:** Single startup line, e.g. `Server listening on :5001 (docs /api-docs)`. Omit separate lines for Swagger, Prometheus, WebSocket, env validation.
- **Use case:** Cleaner startup when running locally or in containers.

### Summary

| Env | Request log | Startup |
|-----|-------------|--------|
| (none) | Full (2 lines/request) | Multiple lines |
| `REQUEST_LOG=minimal` | One line/request, skip health | Unchanged |
| `REQUEST_LOG=errors` | Only 4xx/5xx or slow | Unchanged |
| `STARTUP_LOG=minimal` | Unchanged | One line |

Use **Style 1** (`REQUEST_LOG=minimal`) for minimal server logs; set the env and the middleware will emit one line per request and skip health checks.
