# Postman collection – Rider App API

## Import in Postman

1. **Collection:** File → Import → choose `Rider-App-API.postman_collection.json`
2. **Environment (optional):** Import `Rider-App-Local.postman_environment.json` and select it in the top-right environment dropdown.

## Variables

| Variable     | Where to set | Description |
|-------------|--------------|-------------|
| `baseUrl`   | Collection or Environment | API base URL, e.g. `http://localhost:5000` |
| `accessToken` | Auto-set after **Verify OTP** | JWT for protected endpoints; can also set manually |
| `orderId`   | Manual or from response | Use in Orders folder requests |
| `riderId`   | Auto-set after **Verify OTP** | Rider ID; use in Delivery/Orders |

## Quick test flow

1. Start backend: `npm start` (default port 5000).
2. **Auth → Send OTP**  
   Body: `phoneNumber` (e.g. `+919876543210`), optional `userType: "rider"`.  
   You receive OTP via SMS if config is set, or see it in backend logs in dev.
3. **Auth → Verify OTP**  
   Body: same `phoneNumber`, `code` (6-digit OTP), optional `userType: "rider"`.  
   Response contains `tokens.accessToken`; it is saved to `accessToken` for the collection.
4. Use any request under **Delivery**, **Orders**, **Payouts**, **Incidents**, **Operations**, **KYC**; they use `Bearer {{accessToken}}`.

## Endpoints overview

- **Health:** `GET /healthz`, WebSocket health, Diagnostics (auth).
- **Auth:** Send OTP, Verify OTP, Refresh token, Logout, Me, MFA (setup/verify/enable/disable/status/verify-backup).
- **Delivery:** Create rider, Get rider, Update location, Start/End shift, Set availability.
- **Orders:** Get order, List my orders, Accept/Reject, Pick, Out for delivery, Deliver.
- **Payouts:** Request payout, List, Statement, Get by ID.
- **Incidents:** Create, List.
- **Operations:** Inventory (list/get/update), Fulfillment (list/advance), Warehouses.
- **KYC:** Document types (no auth), Status, Upload (form-data: file + documentTypeCode).
- **Content:** FAQ by key (no auth).

All request bodies and query params are documented in the collection as key-value pairs and in each request description.
