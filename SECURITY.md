# Dashboard Backend Security

## HTTPS

- **Production must use HTTPS.** Terminate TLS at the reverse proxy (e.g. nginx, load balancer) and redirect HTTP to HTTPS.
- Do not send JWTs or cookies over plain HTTP in production.

## Secrets

- **Never commit secrets to version control.** Use environment variables (e.g. `.env`, not committed) or a secrets manager in production.
- **JWT_SECRET**: Required, at least 32 characters. Generate with: `openssl rand -base64 32`.
- **MongoDB credentials**: Store in `MONGO_URI` / `MONGODB_URI` only.
- Rotate secrets periodically and after any suspected compromise.

## CORS

- In production, `ALLOWED_ORIGINS` is enforced: only listed origins are allowed. Set it to your dashboard and admin origins (e.g. `https://dashboard.selorg.com`).
- In development, non-production origins (e.g. localhost) are allowed for convenience.
- Credentials (cookies, `Authorization` header) are supported; ensure origins are explicit in production.

## Rate limiting

- **General API**: `RATE_LIMIT_MAX` requests per 15 minutes per IP (default 1000). Applied to all `/api/v1` routes. Health endpoints are excluded.
- **Login**: `AUTH_RATE_LIMIT_MAX` failed attempts per 15 minutes per IP (default 10). Successful logins are not counted.
- **Account lockout**: After `LOGIN_LOCKOUT_MAX_ATTEMPTS` failed logins per email (default 5), that email is locked for `LOGIN_LOCKOUT_DURATION_SEC` seconds (default 900 = 15 min). Lockout is per-email (in-memory; use Redis for multi-instance). Configure via `.env`: `LOGIN_LOCKOUT_MAX_ATTEMPTS`, `LOGIN_LOCKOUT_DURATION_SEC`.
- Configure via `.env`: `RATE_LIMIT_MAX`, `AUTH_RATE_LIMIT_MAX`.

## RBAC (role-to-module matrix)

All dashboard API routes (except `POST /auth/login` and `POST /auth/logout`) require a valid JWT and a role that is allowed for that module.

| API prefix           | Allowed roles                         |
|----------------------|---------------------------------------|
| `/api/v1/darkstore`  | darkstore, admin, super_admin         |
| `/api/v1/production` | production, admin, super_admin        |
| `/api/v1/merch`      | merch, admin, super_admin            |
| `/api/v1/warehouse`  | warehouse, admin, super_admin         |
| `/api/v1/finance`    | finance, admin, super_admin          |
| `/api/v1/vendor`     | vendor, admin, super_admin           |
| `/api/v1/admin`      | admin, super_admin                    |
| `/api/v1/shared`     | Any authenticated dashboard role      |

- **super_admin** can access all modules.
- **admin** can access the Admin module and, when permitted, other modules as above.
- Role is normalized to lowercase in the JWT.

## Token and session

- **Access token**: Short-lived. Set `JWT_EXPIRES_IN` (e.g. `1h`, `15m`) in `.env`. Default is `1h`.
- **Logout**: `POST /auth/logout` with `Authorization: Bearer <token>` revokes the token (blocklist). Frontend should call this and then clear local storage.
- **Token in header only**: Send the JWT only in the `Authorization: Bearer <token>` header. Do not put tokens in URLs or query parameters.

## Security headers

- **Helmet** is used to set security-related HTTP headers (CSP, X-Frame-Options, etc.). Configuration is in `server.js`.
- **XSS and injection**: `xss-clean`, `express-mongo-sanitize`, and `hpp` are applied to reduce injection and parameter pollution risks.

## Audit logging

- **Auth**: Successful and failed logins are written to the `AuditLog` collection (module `auth`, actions `login_success`, `login_failure`) with IP and user agent.
- **Admin**: User create, update, delete, and role assign are audited (module `admin`, actions `user_create`, `user_update`, `user_delete`, `role_assign`).
- View audit logs via the Admin dashboard (Audit Logs) or query the `AuditLog` collection.

## Dashboard access

- Access is by **company-issued email and password only**. Self-registration is disabled.
- New users are created by administrators (e.g. via Admin dashboard user management).
