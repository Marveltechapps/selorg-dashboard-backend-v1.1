# Customer Backend (mounted at `/api/v1/customer`)

Customer app API: onboarding, auth, home, products, user, admin/home.  
Uses shared MongoDB; no `connectDB()` or `listen()` in this module.

## Collections (MongoDB)

All customer app data uses the following namespaced collections:

| Collection name           | Model / usage |
|---------------------------|----------------|
| `customer_users`          | CustomerUser – app users (phone/email, onboarding, profile) |
| `customer_otp_sessions`  | OtpSession – OTP verification sessions (TTL index) |
| `customer_onboarding_pages` | OnboardingPage – onboarding flow pages |
| `customer_products`       | Product – product catalog |
| `customer_categories`     | Category – product categories |
| `customer_banners`        | Banner – hero/mid banners |
| `customer_home_configs`   | HomeConfig – home screen config (key: main) |
| `customer_home_sections`  | HomeSection – home sections and product refs |
| `customer_lifestyle_items`| LifestyleItem – lifestyle block content |
| `customer_promo_blocks`   | PromoBlock – promo blocks by key |

These collections are separate from HHD (`User`, etc.) and Picker (`PickerUser`, etc.) to avoid model name clashes in the same process.

## Routes (under `/api/v1/customer`)

- `/api/v1/customer/onboarding` – onboarding pages, complete, status
- `/api/v1/customer/auth` – send-otp, verify-otp, resend-otp
- `/api/v1/customer/home` – home payload
- `/api/v1/customer/products/:id` – product detail
- `/api/v1/customer/user/profile` – user profile (auth required)
- `/api/v1/customer/admin/home` – admin CRUD for categories, banners, config, sections, lifestyle, promoblocks
- `/api/v1/customer/health` – health check

## Environment

- `CUSTOMER_JWT_SECRET` – JWT for customer auth (optional; falls back to `JWT_SECRET`)
- Twilio / OTP: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` (optional; mock SMS if unset)
- `OTP_RESEND_COOLDOWN_SECONDS`, `OTP_TTL_SECONDS`, `JWT_ACCESS_EXPIRES_SECONDS` (optional)
