const mongoose = require('mongoose');
const { Schema } = mongoose;

const ZoneSchema = new Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['Serviceable', 'Exclusion', 'Priority', 'Promo-Only'], required: true },
  status: { type: String, enum: ['Active', 'Inactive', 'Pending'], default: 'Active' },
  isVisible: { type: Boolean, default: true },
  color: { type: String, required: true },
  areaSqKm: { type: Number, default: 0 },
  promoCount: { type: Number, default: 0 },
  points: [{
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.models.Zone || mongoose.model('Zone', ZoneSchema);
