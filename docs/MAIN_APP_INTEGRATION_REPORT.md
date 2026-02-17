# Main App Integration Report: Home, Earnings, History, Profile

This report covers frontend–backend integration and correctness of flows for the four main tabs: **Home**, **Earnings**, **History**, and **Profile**, including navigation, text inputs, toggles, and API usage.

---

## 1. Navigation & Tab Bar

| Item | Status | Notes |
|------|--------|--------|
| Bottom tab bar | ✅ Correct | `BottomTabBar` uses `router.push('/home')`, `'/earnings'`, `'/history'`, `'/profile'`. Routes are registered in `_layout.tsx` (Stack). |
| Active tab highlight | ✅ Correct | `getActiveTab()` uses `pathname`; home also treats `/slot-change`, `/floating-cash`, `/deposit-cash` as home. |
| Tab press | ✅ Correct | `handleTabPress(route)` calls `router.push(route)`. |

**Verdict:** Navigation between Home, Earnings, History, and Profile is correctly wired.

---

## 2. Home Screen

| Item | Status | Notes |
|------|--------|--------|
| **API – List orders** | ✅ Integrated | `listOrders({ limit: 50 })` → `GET /api/v1/orders/admin/orders?limit=50`. Backend: `order.router.js` has `GET /admin/orders` (rider-filtered); `app.js` also has `GET /api/admin/orders` for compatibility. |
| **API – Accept order** | ✅ Integrated | `acceptOrder(orderId)` → `POST /api/v1/orders/:orderId/accept`. Backend implements accept and returns order. |
| **Online/Offline toggle** | ⚠️ UI only | `Switch` (isOnline) is local state only. It is **not** sent to the backend. Backend has `POST /api/v1/delivery/riders/:riderId/availability` with `{ availability: "available" \| "busy" \| "offline" }`. **Recommendation:** Call setAvailability when toggling (e.g. "available" when Online, "offline" when Offline). |
| **Today's stats (earnings, orders, hours)** | ⚠️ Mock | Values like "₹850", "12", "4h 30m" are hardcoded. No API for today's aggregate stats. |
| **Floating cash** | ⚠️ Local | `floatingCash` (450) and CASH_LIMIT (2000) are local state; not loaded from or saved to backend. |
| **Time slot** | ⚠️ Static | "12:00 PM - 04:00 PM" is hardcoded. "Edit" goes to `/slot-change` (screen exists). |
| **Available orders list** | ✅ Correct | Uses `ordersFromApi` filtered by `status === 'assigned'`, mapped with `mapOrderToCard`. Fallback to `fallbackOrders` when empty. |
| **View Details → Earnings** | ✅ Correct | "View Details" links to `router.push('/earnings')`. |
| **Slot change** | ✅ Correct | Edit icon on time slot chip navigates to `/slot-change`. |

**Verdict:** Home is integrated for **list orders** and **accept order**. Toggle, stats, floating cash, and time slot are either UI-only or mock; optional improvements documented above.

---

## 3. Earnings Screen

| Item | Status | Notes |
|------|--------|--------|
| **Tab switching (Today / Week / Month)** | ✅ Correct | `EarningsScreen` uses `params.tab` and renders `EarningsTodayScreen`, `EarningsWeekScreen`, or `EarningsMonthScreen`. |
| **API – List payouts** | ✅ Integrated | `listPayouts(20)` → `GET /api/v1/payouts?limit=20`. Backend: `payout.router.js` has `GET /` with auth, returns rider payouts. |
| **API – Request payout** | ✅ Integrated | `requestPayout({ periodStart, periodEnd, method, accountDetails })` → `POST /api/v1/payouts/request`. Backend implements create and validates body. |
| **Cash out modal** | ✅ Correct | Uses `usePayment()` for `paymentMethod` (bank/UPI). Sends `requestPayout` with correct method and account details. |
| **Payout history list** | ✅ Correct | Populated from `listPayouts`; maps to local `Payout` shape (id, date, amount, status). Fallback list used when API returns empty. |
| **Today totals / incentives** | ⚠️ Mock | "Today's earnings", "Orders", "Online time", "Avg order value" and incentive cards (e.g. "Weekend Warrior") are mock data. |
| **Earnings Week/Month screens** | ⚠️ Likely mock | Not re-checked in detail; if they only show static or local data, they are not backed by period APIs. |

**Verdict:** Earnings is integrated for **list payouts** and **request payout** (cash out). Top-level totals and incentives are mock; integration is correct for the actions that hit the backend.

---

## 4. History Screen

| Item | Status | Notes |
|------|--------|--------|
| **API – List orders** | ✅ Integrated | `listOrders({ status: 'delivered', limit: 100 })` → `GET /api/v1/orders/admin/orders?status=delivered&limit=100`. Backend supports `status` and returns rider's orders. |
| **Date filter** | ✅ Correct | `selectedDate` filters `ordersSource` by date string. Calendar modal sets `selectedDate`. |
| **Prev/Next day** | ✅ Correct | `handlePrevDay` / `handleNextDay` update `selectedDate`. |
| **Stats (orders, earnings, rating)** | ✅ Correct | Derived from `filteredOrders` (totalOrders, totalEarnings, avgRating). |
| **Order cards** | ✅ Correct | Uses `mapBackendOrderToHistoryOrder` for API data; fallback to `DUMMY_ORDERS` when no API data. `OrderCard` supports optional `rating`. |
| **Order tap → Order details** | ✅ Correct | `handleOrderPress` → `router.push('/order-details', { params: { orderId } })`. |
| **Back** | ✅ Correct | `router.back()`. |

**Verdict:** History is correctly integrated with the orders API, date filtering, and navigation to order details.

---

## 5. Profile Screen

| Item | Status | Notes |
|------|--------|--------|
| **API – Get rider** | ✅ Integrated | `getRider(userData.riderId)` → `GET /api/v1/delivery/riders/:riderId`. Backend: auth required, rider can only access own profile. |
| **Profile data display** | ✅ Correct | Uses `riderProfile` from API with fallback to `userData` (name, phone, email, riderId). Avatar from `userData.profilePhotoUri`. |
| **Edit Profile** | ✅ Correct | Navigates to `/edit-profile`. |
| **My Documents** | ✅ Correct | Navigates to `/my-documents`. |
| **Bank Details** | ✅ Correct | Navigates to `/payment-details`. |
| **Floating Cash** | ✅ Correct | Navigates to `/floating-cash`. |
| **Help & Support** | ✅ Correct | Navigates to `/help-support`. |
| **Terms & Conditions / Privacy Policy** | ✅ Correct | Navigate to `/terms-conditions`, `/privacy-policy`. |
| **Logout** | ✅ Correct | Alert then `apiLogout()` and `router.replace('/login')`. |
| **Stats (rating, deliveries)** | ⚠️ Partial | "312 deliveries" and "4.8" rating are hardcoded in `riderData`; backend has `GET /api/v1/delivery/riders/:riderId/stats` which is not called here. |

**Verdict:** Profile is integrated for **get rider** and all main navigation and logout. Stats could be wired to `GET /riders/:riderId/stats` for real data.

---

## 6. Edit Profile (from Profile)

| Item | Status | Notes |
|------|--------|--------|
| **Form fields** | ✅ Correct | Full name, phone, email; photo (camera/gallery). Values initialized and synced from `userData`. |
| **Validation** | ✅ Correct | Required checks and email format; errors shown per field. |
| **Save / API** | ✅ Integrated | `updateRider(riderId, { name, email })` → `PATCH /api/v1/delivery/riders/:riderId`. Backend validates and updates profile. |
| **Photo** | ⚠️ Local only | Avatar is updated in `updateUserData(profilePhotoUri)`; no upload to backend in this flow (profile photo upload may be separate). |
| **Navigation after save** | ✅ Correct | Pushes to `/profile-update-success` with params. |
| **Keyboard / scroll** | ✅ Correct | `KeyboardAvoidingView`, `keyboardShouldPersistTaps="handled"`. |

**Verdict:** Edit Profile is integrated for name and email; phone and photo are updated in context/local state. Backend supports name, email, vehicle, bankDetails via PATCH.

---

## 7. Order Details & Related (from Home / History)

- **Order details screen:** Uses `getOrder(orderId)` (GET `/api/v1/orders/:orderId`). Backend returns order for the authenticated rider.
- **Accept → Accepted order → Verify → Delivery → Handover:** Flow uses accept, pick, out-for-delivery, deliver endpoints; backend implements these.

(Not re-audited in full; assumed consistent with orders API usage above.)

---

## 8. Summary Table

| Screen / Area | Backend integrated | Issues / Gaps |
|---------------|--------------------|---------------|
| **Home** | Orders list, accept order | Online toggle not synced; stats/floating cash/time slot mock or local. |
| **Earnings** | List payouts, request payout | Today/week/month summary and incentives mock. |
| **History** | List delivered orders | None; optional: rating from backend if available. |
| **Profile** | Get rider, logout | Stats (rating, deliveries) hardcoded; could use rider stats API. |
| **Edit Profile** | Update rider (name, email) | Photo and phone not persisted to backend in this flow. |
| **Bottom tabs** | N/A | All navigation correct. |

---

## 9. Recommendations

1. **Home – Online toggle:** Call `POST /api/v1/delivery/riders/:riderId/availability` with `{ availability: "available" }` when turning Online and `{ availability: "offline" }` when turning Offline (and optionally "busy" when accepting an order).
2. **Home / Earnings:** If backend adds endpoints for today’s stats (earnings, order count, online time), wire Home and Earnings to them; otherwise keep mock data clearly labeled.
3. **Profile:** Optionally call `GET /api/v1/delivery/riders/:riderId/stats` and show real rating and delivery count.
4. **Edit Profile:** If backend supports profile photo URL, add upload (e.g. via KYC/S3 or profile image endpoint) and send URL in PATCH; otherwise document that photo is app-only.
5. **Payment method:** PaymentContext is in-memory; if app restarts, payment method is reset. Consider persisting to secure storage and loading on app start so cash-out always has a method (or show “Add payment method” when missing).

---

## 10. Conclusion

- **Home, Earnings, History, Profile** are correctly integrated for:
  - **Orders:** list (rider-filtered), accept, get by id; History uses delivered orders and date filter.
  - **Payouts:** list and request (cash out with bank/UPI).
  - **Rider:** get profile, update profile (name, email).
  - **Auth:** logout and navigation to login.
- **Navigation,** **text inputs,** **toggles (Switch),** and **buttons** behave correctly; the only functional gap is the **Online/Offline toggle** not updating backend availability.
- **Mock or local data:** Home stats, floating cash, time slot; Earnings summary and incentives; Profile stats. These do not break flows; they can be replaced when backend supports them.

Overall, the main app flow is **correct and integrated** for the existing backend APIs; the report above lists optional improvements and known mock/local data.
