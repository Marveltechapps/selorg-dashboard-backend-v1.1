const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomerProduct', required: true },
    productName: { type: String, default: '' },
    variantId: { type: String, default: '' },
    variantSize: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    image: { type: String, default: '' },
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomerUser', required: true },
    orderNumber: { type: String, required: true, unique: true },
    items: [orderItemSchema],
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'getting-packed', 'on-the-way', 'arrived', 'delivered', 'cancelled'],
      default: 'pending',
    },
    addressId: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomerAddress' },
    deliveryAddress: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
      landmark: String,
    },
    paymentMethodId: { type: String, default: '' },
    paymentMethod: {
      methodType: { type: String, enum: ['card', 'upi', 'cash'], default: 'cash' },
      last4: String,
    },
    itemTotal: { type: Number, required: true, default: 0 },
    handlingCharge: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalBill: { type: Number, required: true, default: 0 },
    estimatedDelivery: { type: Date },
  },
  { timestamps: true }
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });

const Order =
  mongoose.models.CustomerOrder ||
  mongoose.model('CustomerOrder', orderSchema, 'customer_orders');

module.exports = { Order };
