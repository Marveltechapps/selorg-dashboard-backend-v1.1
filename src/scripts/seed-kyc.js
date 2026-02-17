"use strict";

require("dotenv").config();
const mongoose = require("mongoose");
const { KycDocumentType } = require("../models/KycDocumentType.js");
const { Content } = require("../models/Content.js");

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("MONGO_URI required");
  process.exit(1);
}

const documentTypes = [
  { code: "aadhar", label: "Aadhar Card", iconKey: "aadhar", required: true, sortOrder: 1, active: true },
  { code: "pan", label: "PAN Card", iconKey: "pan", required: true, sortOrder: 2, active: true },
  { code: "drivingLicense", label: "Driving License", iconKey: "drivingLicense", required: true, sortOrder: 3, active: true },
];

const kycFaq = {
  key: "account-faq-kyc-documents",
  locale: "en",
  title: "KYC Documents",
  items: [
    { id: "1", question: "How do I upload KYC documents?", answer: "To upload KYC documents:\n\n1. Go to Profile > My Documents\n2. Select the document type\n3. Take clear photo or choose from gallery\n4. Enter document number\n5. Submit for verification\n\nEnsure photos are:\n• Clear and readable\n• All corners visible\n• Good lighting\n• No glare or shadows" },
    { id: "2", question: "What if my document is rejected?", answer: "If document is rejected:\n\n1. Check rejection reason in email/app\n2. Common reasons:\n   - Unclear photo\n   - Expired document\n   - Name mismatch\n   - Wrong document type\n3. Upload corrected document\n4. Contact support if issue persists\n\nYou can resubmit documents immediately after rejection." },
    { id: "3", question: "Can I update my documents?", answer: "Yes, you can update documents:\n\n1. Go to My Documents\n2. Click on the document card\n3. Select \"Change\" button\n4. Upload new document\n5. Submit for verification\n\nUpdated documents go through verification again (24-48 hours)." },
    { id: "4", question: "What if my document expires?", answer: "If document expires:\n\n1. You'll receive notification before expiry\n2. Upload renewed document immediately\n3. Your account remains active during renewal\n4. Verification takes 24-48 hours\n\nExpired documents may restrict some features until renewed." },
  ],
};

async function run() {
  await mongoose.connect(MONGO_URI);
  await KycDocumentType.deleteMany({});
  for (const d of documentTypes) {
    await KycDocumentType.create(d);
  }
  console.log("KYC document types seeded.");
  await Content.findOneAndUpdate(
    { key: kycFaq.key, locale: kycFaq.locale },
    kycFaq,
    { upsert: true }
  );
  console.log("KYC FAQ content seeded.");
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
