# HHD orders seed

Seeds sample orders (and an optional test user) into the HHD database so you can test the **HHD app** frontend (Order Received screen, dashboard, pick flow).

## Prerequisites

- Backend `.env` has `MONGO_URI` or `MONGODB_URI` pointing to the same MongoDB used by the HHD API.

## Quick run

From **backend repo root** (selorg-dashboard-backend-v1.1):

```bash
npm run seed:hhd
```

Or:

```bash
node scripts/seed-hhd-orders.js
```

## What gets seeded

1. **Test user** (if not present): mobile `7418268091`, name "Test Picker", role picker.  
   You can change the mobile with `SEED_HHD_MOBILE=9999888877 node scripts/seed-hhd-orders.js`.

2. **Pending orders** (for Order Received screen): 3 orders with status `pending`, e.g.  
   `ORD-SEED-001`, `ORD-SEED-002`, `ORD-SEED-003` (zones A/B/C, item counts 8/12/5).  
   Each order has sample **items** so the pick flow (order detail + item list) works.

3. **Completed orders for today**: 2 completed orders so the **dashboard** shows "today completed" count and average pick time.

## Testing in the HHD app

1. Ensure the backend is running and the HHD app is pointed at it (e.g. `EXPO_PUBLIC_API_URL` in HHD app `.env`).
2. Run the seed once: `npm run seed:hhd`.
3. In the HHD app, log in with mobile **7418268091** (or the one you set with `SEED_HHD_MOBILE`).
4. Complete OTP; you should land on home, then after a few seconds (or tap) see the Order Received screen with the 3 pending orders.
5. Select an order and Start Picking to exercise the full pick flow.

## Options

| Env var | Description |
|--------|-------------|
| `SEED_HHD_MOBILE` | Mobile number for the test user (default `7418268091`). |
| `SEED_HHD_ORDERS_ONLY=1` | Do not create/ensure test user; only seed orders. |
| `SEED_HHD_USER_ID` | When `SEED_HHD_ORDERS_ONLY=1`, use this MongoDB `_id` as `userId` for all seeded orders. |

Example: seed orders for an existing user whose ID you know:

```bash
SEED_HHD_ORDERS_ONLY=1 SEED_HHD_USER_ID=507f1f77bcf86cd799439011 node scripts/seed-hhd-orders.js
```

## Idempotency

- Re-running the script does not duplicate orders: existing `orderId`s are skipped.
- The test user is created only if no user exists with the given mobile.
