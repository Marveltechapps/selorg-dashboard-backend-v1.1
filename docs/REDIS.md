# Redis cache setup

The backend uses Redis for server-side response caching when `REDIS_URL` is set. If Redis is not configured or unavailable, the app runs without cache (all cache reads miss, writes no-op).

## Environment

- **`REDIS_URL`** (optional): Redis connection URL. Example: `redis://127.0.0.1:6379`.  
  For production use TLS and auth, e.g. `rediss://user:password@host:6380`.
- **`DISABLE_CACHE`** (optional): Set to `true` to disable cache even when `REDIS_URL` is set (e.g. for local debugging).
- **TTL env vars** (optional): `CACHE_TTL_DASHBOARD`, `CACHE_TTL_RIDERS`, `CACHE_TTL_LOCATION`, `CACHE_TTL_ALERTS`, `CACHE_TTL_SYSTEM_HEALTH`, `CACHE_TTL_ANALYTICS`, `CACHE_TTL_APPROVALS`, `CACHE_TTL_STAFF`, `REDIS_TTL_DEFAULT` (values in seconds).

## Local Redis (Docker)

```bash
docker run -d -p 6379:6379 --name redis redis:7-alpine
```

Then in `.env`:

```env
REDIS_URL=redis://127.0.0.1:6379
```

## Health check

When `REDIS_URL` is set, the readiness endpoint `/health/ready` includes a `redis` check. The app is still considered ready if Redis is down (cache is optional).

## Cached endpoints (read-through)

- **Shared**: dashboard summary, alerts (list, by id), system-health (summary, devices, by id), analytics (rider performance, SLA, fleet utilization), approvals (summary, queue, by id).
- **Rider**: riders list, rider by id, rider location, rider distribution.
- **Warehouse**: staff summary, staff list, shifts list (keys `staff:summary`, `staff:list:*`, `staff:shifts:*`; TTL `CACHE_TTL_STAFF` or 30s).

Responses from cache send `X-Cache: HIT`; otherwise `X-Cache: MISS`.

## Logging and monitoring

- **Cache HIT/MISS**: Logged at `debug` level in cache middleware and in `getCachedOrCompute` (key/path). Set `LOG_LEVEL=debug` to see them.
- **Admin cache stats**: `GET /api/v1/admin/cache/stats` returns `{ success, cache: { connected, keysCount, memoryUsed } }`. Secure this route in production (e.g. admin-only auth).

## Documentation

See [REDIS_CACHE_IMPLEMENTATION_PLAN.md](../../Docs/REDIS_CACHE_IMPLEMENTATION_PLAN.md) in the Docs workspace for the full implementation plan and conventions.
