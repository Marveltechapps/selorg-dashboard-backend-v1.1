# KYC documents: where they are stored and how to view them

## Where are the uploaded documents stored?

- **Storage:** Uploaded KYC documents (Aadhar, PAN, Driving License images/files) are stored in **AWS S3** (or the bucket configured in your backend).
- **Backend:** The backend uses `backend/src/services/s3.service.js` to upload files. The S3 key pattern is:
  - `riders/{userId}/kyc/{documentTypeCode}/{timestamp}_{random}_{filename}`
- **Database:** MongoDB stores a record per user per document type in the `UserKycDocument` collection, including:
  - `userId`, `documentTypeCode`, `status`, `fileUrl`, `uploadedAt`, `verifiedAt`, `rejectedReason`
- **Config:** Bucket and region come from env: `AWS_BUCKET_RIDER_DOCUMENTS`, `AWS_REGION`, and AWS credentials.

So **yes, the documents are stored** – in S3 – and their URLs are saved in the database.

---

## How to see the uploaded document (image/file) in the app

- **In the app:** On the **KYC Documents** screen, for each document that is **Verified**, a **"View document"** button is shown.
- Tapping **"View document"** opens the stored file URL in the device browser (or in-app browser), so you can view the image or PDF you uploaded.
- The backend now returns `fileUrl` in the KYC status API (`GET /api/v1/kyc/status`) for each uploaded document, so the app can show this button and open the link.

If you don’t see **"View document"** for a verified doc, the backend may not have saved a `fileUrl` (e.g. older uploads or S3 not configured). New uploads will have it.

---

## Tunnel option – what it is and what it’s for

- **Expo tunnel** (`npm run start:tunnel`) is used so your **phone can connect to the Metro dev server** when the phone and PC are on different networks (e.g. different Wi‑Fi or mobile data).
  - It does **not** control where KYC documents are stored or how you view them.
  - To use it: run `npm run start:tunnel`, wait for “Tunnel connected”, then in Expo Go use **Enter URL manually** and paste the `exp://...` URL from the terminal. See `frontend/RUN_EXPO_GO.md` for full steps.

- **Viewing KYC documents** is separate:
  - Documents are stored in **S3**; the app shows a **"View document"** link for verified documents, which opens that S3 (or storage) URL in the browser.
  - You do **not** need to enable or use the Expo tunnel just to view uploaded documents; you only need the app to be able to call the backend and open the document URL.

**Summary:** Use **tunnel** to connect Expo Go to the dev server. Use **"View document"** on the KYC screen to open and check the uploaded document in the browser.
