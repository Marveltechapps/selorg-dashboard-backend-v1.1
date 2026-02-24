# Dashboard Backend Caching

All dashboard managed elements (admin, finance, vendor, warehouse, production, darkstore, merch, shared, HHD, picker, customer) use HTTP response caching for GET requests. Writes invalidate the relevant cache entries so subsequent reads return fresh data.

## Configuration

- **DISABLE_CACHE** – Set to `true` to disable all response caching (default: unset/false).
- The admin dashboard uses **in-memory cache only** (no Redis). All GET response caching is stored in process memory.

## TTL environment variables (seconds)

All TTLs are in seconds. Omitted env vars use the defaults below.

### Shared / core
- `CACHE_TTL_DASHBOARD` (default: 15)
- `CACHE_TTL_RIDERS` (default: 15)
- `CACHE_TTL_LOCATION` (default: 5)
- `CACHE_TTL_ALERTS` (default: 30)
- `CACHE_TTL_SYSTEM_HEALTH` (default: 60)
- `CACHE_TTL_ANALYTICS` (default: 120)
- `CACHE_TTL_APPROVALS` (default: 30)
- `CACHE_TTL_STAFF` (default: 30)
- `CACHE_TTL_DEFAULT` (default: 60)

### Admin
- `CACHE_TTL_ADMIN` (default: 60)
- `CACHE_TTL_ADMIN_USERS` (default: 60)
- `CACHE_TTL_ADMIN_ROLES` (default: 120)
- `CACHE_TTL_ADMIN_PERMISSIONS` (default: 120)
- `CACHE_TTL_ADMIN_STORES` (default: 60)
- `CACHE_TTL_ADMIN_AUDIT` (default: 60)

### Finance
- `CACHE_TTL_FINANCE` (default: 60)
- `CACHE_TTL_FINANCE_SUMMARY` (default: 15)
- `CACHE_TTL_FINANCE_PAYMENTS` (default: 30)
- `CACHE_TTL_FINANCE_REFUNDS` (default: 30)
- `CACHE_TTL_FINANCE_RECONCILIATION` (default: 60)
- `CACHE_TTL_FINANCE_LEDGER` (default: 60)
- `CACHE_TTL_FINANCE_INVOICES` (default: 60)
- `CACHE_TTL_FINANCE_ANALYTICS` (default: 120)
- `CACHE_TTL_FINANCE_APPROVALS` (default: 30)

### Vendor, warehouse, production, darkstore, merch
- `CACHE_TTL_VENDOR` (default: 60)
- `CACHE_TTL_WAREHOUSE` (default: 60)
- `CACHE_TTL_PRODUCTION` (default: 60)
- `CACHE_TTL_DARKSTORE` (default: 60)
- `CACHE_TTL_MERCH` (default: 60)

### Shared (additional)
- `CACHE_TTL_SEARCH` (default: 30)
- `CACHE_TTL_COMMUNICATION` (default: 30)
- `CACHE_TTL_INVENTORY_SYNC` (default: 30)
- `CACHE_TTL_BULK` (default: 60)
- `CACHE_TTL_AUTOMATION` (default: 60)

### HHD, Picker, Customer
- `CACHE_TTL_HHD` (default: 30)
- `CACHE_TTL_HHD_DASHBOARD` (default: 15)
- `CACHE_TTL_PICKER` (default: 60)
- `CACHE_TTL_PICKER_LOCATIONS` (default: 60)
- `CACHE_TTL_PICKER_TRAINING` (default: 120)
- `CACHE_TTL_CUSTOMER` (default: 60)
- `CACHE_TTL_CUSTOMER_HOME` (default: 60)
- `CACHE_TTL_CUSTOMER_CATEGORIES` (default: 120)
- `CACHE_TTL_CUSTOMER_PRODUCTS` (default: 60)
- `CACHE_TTL_CUSTOMER_LEGAL` (default: 300)

## Behavior

- **Cache key**: `cache:<full URL>:<query JSON>` (GET requests only).
- **Write-time invalidation**: After create/update/delete, controllers call cache invalidation helpers (e.g. `cacheInvalidation.invalidateUsers()`) so the next GET sees fresh data.
- **Response headers**: Cached GETs include `X-Cache: HIT` or `X-Cache: MISS` and `X-Cache-Key`.
- **Admin cache stats**: `GET /api/v1/admin/cache/stats` (admin auth required) returns in-memory cache key count.
