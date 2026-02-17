const mongoose = require('mongoose');
const userSchema = new mongoose.Schema(
  {
    phoneNumber: { type: String },
    email: { type: String, default: undefined },
    name: { type: String },
    phoneVerified: { type: Boolean, default: false },
    phoneVerifiedAt: { type: Date, default: null },
    onboardingCompleted: { type: Boolean, default: false },
    onboardingCompletedAt: { type: Date, default: null },
    acceptedTermsVersion: { type: String, default: null },
    acceptedTermsAt: { type: Date, default: null },
    acceptedPrivacyVersion: { type: String, default: null },
    acceptedPrivacyAt: { type: Date, default: null },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);
userSchema.index({ onboardingCompleted: 1 });
userSchema.index({ phoneNumber: 1 }, { sparse: true });
userSchema.index({ email: 1 }, { unique: true, sparse: true, name: 'email_unique_sparse' });
const CustomerUser = mongoose.models.CustomerUser || mongoose.model('CustomerUser', userSchema, 'customer_users');
module.exports = { CustomerUser };
