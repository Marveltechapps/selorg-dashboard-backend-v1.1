# Postman Collections

## Selorg – All Apps (Unified) – **Primary**

**File:** `Selorg-All-Apps.postman_collection.json`

Single consolidated collection for **all 4 apps**: HHD, Picker, Rider, Customer. Includes health checks, full OTP flows (Send → Resend → Verify), and authenticated endpoints (Get Me, Orders, Profile).

1. Set `baseUrl` (default `https://api.selorg.com`)
2. Set `mobile` / `phone` / `phoneNumber` for testing
3. Run Auth flow: Send OTP → Verify OTP (token auto-saved)
4. For **Customer**: Send OTP returns `sessionId` (auto-saved) – use for Verify/Resend

---

## OTP All Apps (OTP-only)

**File:** `OTP-All-Apps.postman_collection.json`

OTP-only endpoints for all 4 apps (lightweight).

1. Set `baseUrl` (e.g. `http://localhost:5000` or `https://api.selorg.com`)
2. Set `mobile` for testing (default `9876543210`)
3. For **Customer**: Run Send OTP first, copy `sessionId` from response into the `sessionId` variable

### Endpoints

| App     | Send OTP                        | Verify OTP                         | Resend OTP                         |
|---------|----------------------------------|------------------------------------|------------------------------------|
| HHD     | POST `/api/v1/hhd/auth/send-otp`   | POST `/api/v1/hhd/auth/verify-otp`   | POST `/api/v1/hhd/auth/resend-otp`   |
| Picker  | POST `/api/v1/picker/auth/send-otp` | POST `/api/v1/picker/auth/verify-otp` | POST `/api/v1/picker/auth/resend-otp` |
| Rider   | POST `/api/signin/send-otp`        | POST `/api/signin/verify-otp`        | POST `/api/signin/resend-otp`        |
| Customer| POST `/api/v1/customer/auth/send-otp` | POST `/api/v1/customer/auth/verify-otp` | POST `/api/v1/customer/auth/resend-otp` |

### Test mobile

- **9698790921** → fixed OTP **8790** (no SMS sent)

Per `Docs/OTP_PROCESS_WORKFLOW.md`.
