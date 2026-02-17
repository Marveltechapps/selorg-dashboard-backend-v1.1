const mongoose = require('mongoose');
const categorySchema = new mongoose.Schema(
  { name: { type: String, required: true }, slug: { type: String, required: true, unique: true }, imageUrl: String, isActive: { type: Boolean, default: true }, order: { type: Number, default: 0 } },
  { timestamps: true }
);
categorySchema.index({ isActive: 1, order: 1 });
const Category = mongoose.models.CustomerCategory || mongoose.model('CustomerCategory', categorySchema, 'customer_categories');
module.exports = { Category };
