# KYC Documents Module – Dynamic Elements & Implementation Plan

## Module scope

- **KYC Upload page**: `frontend/app/kyc-upload.tsx` → `KYCUploadScreen.tsx` (document list, status, upload flow).
- **KYC FAQ page**: `frontend/app/account-faq-kyc-documents.tsx` → `GenericFAQScreen` with `routeKey="account-faq-kyc-documents"`.
- **Related**: `AccountDocumentsScreen` links to the KYC FAQ; individual upload screens: aadhar, pan, driving-license.

---

## 1. Elements to be dynamic (backend-managed)

### 1.1 KYC Upload page

| Element | Current state | Backend-managed | Notes |
|--------|----------------|------------------|--------|
| **Document types list** | Hardcoded: Aadhar, PAN, Driving License in `DOCUMENTS` | ✅ Yes | Types, labels, order, required/optional, icon key. |
| **Document status per user** | Local state + URL params | ✅ Yes | `not_started` \| `pending` \| `verified` \| `failed` + optional rejection message. |
| **Page copy** | Hardcoded in UI | Optional | Header title/subtitle, info box text (e.g. “24–48 hours”). |
| **Skip KYC** | Always shown | Optional | Backend flag to show/hide “Skip for now”. |
| **Verification SLA / info text** | Hardcoded “24–48 hours” | Optional | Single config string or key. |

### 1.2 KYC FAQ page (account-faq-kyc-documents)

| Element | Current state | Backend-managed | Notes |
|--------|----------------|------------------|--------|
| **FAQ title** | In `FAQ_DATA['account-faq-kyc-documents'].title` | ✅ Yes | e.g. “KYC Documents”. |
| **FAQ items** | In `FAQ_DATA['account-faq-kyc-documents'].faqs` | ✅ Yes | List of `{ id, question, answer }` (order preserved). |

### 1.3 Account & Documents hub (optional)

| Element | Current state | Backend-managed | Notes |
|--------|----------------|------------------|--------|
| **Topic list** | `accountTopics` in `AccountDocumentsScreen` | Optional | Title, description, route for “KYC Documents” and other topics. |

---

## 2. AWS S3 storage (upload docs → S3, link in MongoDB)

- **Rider profile pictures**: bucket `selorg-rider-profile` (existing use case).
- **Rider KYC/documents**: bucket `selorg-rider-documents` — all KYC uploads (Aadhar, PAN, Driving License, etc.) go here.
- **Region**: `ap-south-1`.
- **Credentials**: Store in backend `.env` only; never commit secrets to the repo. Use:
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `AWS_REGION=ap-south-1`
  - `AWS_BUCKET_RIDER_PROFILE=selorg-rider-profile`
  - `AWS_BUCKET_RIDER_DOCUMENTS=selorg-rider-documents`
- **Flow**: App sends file to backend → backend uploads to S3 (correct bucket by use case) → backend saves the S3 object URL in MongoDB and returns updated status.

---

## 3. Recommended backend data model (high level)

- **Document type config** (app-level, admin-editable): e.g. `kyc_document_types`: `code`, `label`, `iconKey`, `required`, `sortOrder`, `active`.
- **User document status** (per user): e.g. `user_kyc_documents` or fields on user/rider: document type, `status`, `rejectedReason`, `verifiedAt`, `uploadedAt`, **`fileUrl`** (S3 URL of uploaded file in `selorg-rider-documents`).
- **Content / FAQ** (app-level): e.g. `content` or `faq` table: `key` (e.g. `account-faq-kyc-documents`), `title`, `items` (array of `{ id, question, answer }`), `locale` if needed.

---

## 4. Implementation plan

### Phase 1 – Backend: AWS S3 + KYC config and status

1. **AWS S3 setup**  
   - Add AWS SDK (e.g. `@aws-sdk/client-s3`) in backend.  
   - Configure using env: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_BUCKET_RIDER_DOCUMENTS` (and `AWS_BUCKET_RIDER_PROFILE` for profile pics).  
   - **KYC documents**: upload to bucket `selorg-rider-documents`; store the resulting S3 object URL in MongoDB.  
   - **Rider profile**: use bucket `selorg-rider-profile` when implementing/using profile picture upload.  
   - Use a consistent key pattern for documents, e.g. `riders/{riderId}/kyc/{documentTypeCode}/{timestamp}_{originalName}` (or use UUID for uniqueness).  
   - Ensure bucket policy/CORS allows backend to upload; do not expose credentials to the frontend.

2. **Document types (config)**  
   - Add collection/model for KYC document types (e.g. `KycDocumentType`: code, label, iconKey, required, sortOrder, active).  
   - Seed or API to return list for app (e.g. `GET /api/v1/kyc/document-types`).  
   - Optional: admin API to CRUD document types.

3. **User document status + file URL in MongoDB**  
   - Add storage for per-user, per-document (new collection or fields on rider/user).  
   - Fields: userId/riderId, documentTypeCode, status, rejectedReason?, uploadedAt?, verifiedAt?, **fileUrl** (S3 URL from `selorg-rider-documents`).  
   - APIs:  
     - `GET /api/v1/kyc/status` – list current user’s document statuses (and optionally merge with document-types). Include `fileUrl` only when needed for admin/support; optionally omit in app response for privacy.  
     - `POST /api/v1/kyc/upload` (multipart/form-data): receive file + document type → upload file to S3 (`AWS_BUCKET_RIDER_DOCUMENTS`) → save S3 URL and set status to `pending` in MongoDB → return updated status.  
     - Optional: webhook or admin API to set `verified` / `failed` + message.

4. **Auth**  
   - All KYC endpoints use existing auth middleware (e.g. `authenticate`); responses scoped to current user.

### Phase 2 – Backend: FAQ / content

5. **FAQ content API**  
   - Add content/FAQ store (e.g. `content` or `faq` by key).  
   - `GET /api/v1/content/faq/:key` (e.g. `key=account-faq-kyc-documents`) returns `{ title, faqs: [{ id, question, answer }] }`.  
   - Seed or admin UI for `account-faq-kyc-documents`.  
   - Optional: locale query param for i18n.

### Phase 3 – Frontend: KYC Upload page

6. **Document list from backend**  
   - Replace hardcoded `DOCUMENTS` with data from `GET /api/v1/kyc/document-types` (and optionally from `GET /api/v1/kyc/status`).  
   - Map `iconKey` to existing icons (aadhar, pan, drivingLicense) or add new ones.  
   - Keep a fallback list if API fails (or use cached config).

7. **Status from backend**  
   - On load, call `GET /api/v1/kyc/status` and set `documents` state.  
   - After upload (in upload screens), either refetch status or get updated status from upload API response and pass back to KYC list (current params flow can remain until uploads go to backend).  
   - Show rejection message from backend when status is `failed`.

8. **Optional copy and behaviour**  
   - If backend exposes page copy (e.g. header, info box, SLA), add a small content API or include in KYC config and use it on the upload page.  
   - If backend exposes “skip KYC allowed”, show/hide “Skip for now” accordingly.

### Phase 4 – Frontend: KYC FAQ page

9. **FAQ from backend**  
   - For `routeKey="account-faq-kyc-documents"`, fetch `GET /api/v1/content/faq/account-faq-kyc-documents` instead of using `FAQ_DATA`.  
   - Use response for title and list; keep loading and error states.  
   - Optional: extend `GenericFAQScreen` to support multiple FAQ keys from backend with fallback to local `FAQ_DATA` for offline or missing key.

### Phase 5 – Integration and upload flow

10. **Upload flow**  
   - App sends file (multipart) + document type to `POST /api/v1/kyc/upload`.  
   - Backend uploads file to AWS S3 bucket `selorg-rider-documents`, then saves the S3 object URL in MongoDB (user document record) and sets status to `pending`.  
   - After success, get new status from response or refetch status; then navigate back to KYC upload list with updated state (or deep link params if you keep them).

11. **Testing and rollout**  
    - Test with document-types and status APIs; then add FAQ and optional copy.  
    - Feature-flag or env to switch between “backend FAQ” vs “local FAQ” if needed.

### Postman collection for testing (after backend is done)

Once **Phase 1** and **Phase 2** (backend) are implemented, provide a **Postman collection JSON file** so the KYC module can be tested in Postman without the app.

- **When**: After backend KYC + FAQ APIs are ready.
- **What to include in the JSON**:
  - **Auth**: A request or folder to obtain a token (e.g. login) and use it as `Authorization: Bearer <token>` (or as a collection variable) for protected endpoints.
  - **KYC document types**: `GET {{baseUrl}}/api/v1/kyc/document-types` (no auth if public; add auth if required).
  - **KYC status**: `GET {{baseUrl}}/api/v1/kyc/status` (authenticated).
  - **KYC upload**: `POST {{baseUrl}}/api/v1/kyc/upload` with `multipart/form-data` (file + document type); authenticated.
  - **FAQ**: `GET {{baseUrl}}/api/v1/content/faq/account-faq-kyc-documents` (auth only if your API requires it).
- **Collection variables**: `baseUrl` (e.g. `http://localhost:3000` or your backend URL), and `token` (or use Postman auth at collection level).
- **Where to keep it**: e.g. `docs/postman/kyc-module.postman_collection.json` (or similar) so anyone can import and run the requests.

This allows QA and developers to verify document-types, status, upload (to S3 + MongoDB), and FAQ responses from Postman before or in parallel with frontend integration.

---

## 5. Summary: what the backend should own

- **Required**  
  - **AWS S3**: Upload KYC documents to bucket `selorg-rider-documents`; store the file URL in MongoDB. (Rider profile pictures use `selorg-rider-profile`.)  
  - List of KYC document types (and their labels, order, required flag).  
  - Per-user, per-document status and **fileUrl** (S3 link) in MongoDB; rejection message when failed.  
  - FAQ content for “KYC Documents” (title + Q&A list).

- **Optional**  
  - Page copy (header, info box, SLA text).  
  - “Skip KYC” visibility.  
  - Account & Documents hub topic list (if you want that dynamic too).

**Credentials**: Add AWS keys and bucket names to backend `.env` only; never commit them. Use `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_BUCKET_RIDER_PROFILE`, `AWS_BUCKET_RIDER_DOCUMENTS`.

This keeps the app flexible for new document types, localization, and compliance changes without app releases, while leaving UI layout and navigation in the frontend.
