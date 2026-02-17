const mongoose = require('mongoose');
const homeConfigSchema = new mongoose.Schema(
  { key: { type: String, default: 'main', unique: true }, heroVideoUrl: String, searchPlaceholder: String, deliveryTypeLabel: String, organicTagline: String, organicIconUrl: String, sectionOrder: { type: [String], default: [] }, sectionVisibility: { type: Object, default: {} } },
  { timestamps: true }
);
const HomeConfig = mongoose.models.CustomerHomeConfig || mongoose.model('CustomerHomeConfig', homeConfigSchema, 'customer_home_configs');
module.exports = { HomeConfig };
