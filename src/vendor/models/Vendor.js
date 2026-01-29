<<<<<<< HEAD
const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
});

const AddressSchema = new mongoose.Schema({
  line1: String,
  line2: String,
  city: String,
  state: String,
  pincode: String,
});

const VendorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    status: { type: String, default: 'pending' },
    contact: ContactSchema,
    address: AddressSchema,
    sla: { type: Number, default: 0 },
    activeRelationships: { type: Number, default: 0 },
    onboarding: { type: mongoose.Schema.Types.Mixed },
    metadata: { type: mongoose.Schema.Types.Mixed },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Vendor || mongoose.model('Vendor', VendorSchema);

=======
const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
});

const AddressSchema = new mongoose.Schema({
  line1: String,
  line2: String,
  city: String,
  state: String,
  pincode: String,
});

const VendorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    status: { type: String, default: 'pending' },
    contact: ContactSchema,
    address: AddressSchema,
    sla: { type: Number, default: 0 },
    activeRelationships: { type: Number, default: 0 },
    onboarding: { type: mongoose.Schema.Types.Mixed },
    metadata: { type: mongoose.Schema.Types.Mixed },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Vendor || mongoose.model('Vendor', VendorSchema);

>>>>>>> 6591dc33a9b88417e6a52adeaff72e27b1dee13a
