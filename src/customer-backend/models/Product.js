const mongoose = require('mongoose');
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    images: [{ type: String }],
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    discount: { type: String },
    quantity: { type: String },
    description: { type: String },
    variants: [{ sku: String, size: String, price: Number, originalPrice: Number }],
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomerCategory' },
    isActive: { type: Boolean, default: true },
    order: { type: Number },
  },
  { timestamps: true }
);
productSchema.index({ isActive: 1, order: 1 });
const Product = mongoose.models.CustomerProduct || mongoose.model('CustomerProduct', productSchema, 'customer_products');
module.exports = { Product };
