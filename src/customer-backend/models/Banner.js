const mongoose = require('mongoose');
const bannerSchema = new mongoose.Schema(
  { slot: { type: String, enum: ['hero', 'mid'], default: 'hero' }, title: String, imageUrl: { type: String, required: true }, link: String, isActive: { type: Boolean, default: true }, startDate: Date, endDate: Date, order: { type: Number, default: 0 } },
  { timestamps: true }
);
bannerSchema.index({ slot: 1, isActive: 1, order: 1 });
const Banner = mongoose.models.CustomerBanner || mongoose.model('CustomerBanner', bannerSchema, 'customer_banners');
module.exports = { Banner };
