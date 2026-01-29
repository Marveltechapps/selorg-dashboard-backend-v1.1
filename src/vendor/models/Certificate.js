<<<<<<< HEAD
const mongoose = require('mongoose');

const CertificateSchema = new mongoose.Schema(
  {
    vendorId: { type: String, required: true },
    type: String,
    issuedBy: String,
    issuedAt: Date,
    expiresAt: Date,
    status: { type: String, default: 'valid' },
    fileUrl: String,
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

module.exports = mongoose.models.Certificate || mongoose.model('Certificate', CertificateSchema);

=======
const mongoose = require('mongoose');

const CertificateSchema = new mongoose.Schema(
  {
    vendorId: { type: String, required: true },
    type: String,
    issuedBy: String,
    issuedAt: Date,
    expiresAt: Date,
    status: { type: String, default: 'valid' },
    fileUrl: String,
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

module.exports = mongoose.models.Certificate || mongoose.model('Certificate', CertificateSchema);

>>>>>>> 6591dc33a9b88417e6a52adeaff72e27b1dee13a
