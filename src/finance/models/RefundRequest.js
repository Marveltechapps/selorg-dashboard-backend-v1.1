const mongoose = require('mongoose');

const refundRequestSchema = new mongoose.Schema({
  orderId: { type: String, required: true, index: true },
  customerId: { type: String, required: true, index: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true, index: true },
  reasonCode: { 
    type: String, 
    required: true, 
    enum: ['item_damaged', 'expired', 'late_delivery', 'wrong_item', 'customer_cancelled', 'other'],
    index: true 
  },
  reasonText: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true, default: 'USD' },
  requestedAt: { type: Date, default: Date.now, index: true },
  status: { 
    type: String, 
    required: true, 
    enum: ['pending', 'approved', 'rejected', 'processed', 'escalated'],
    index: true 
  },
  channel: { 
    type: String, 
    required: true, 
    enum: ['customer_support', 'self_service', 'ops_adjustment'] 
  },
  paymentId: { type: String },
  notes: { type: String },
}, {
  timestamps: true,
});

refundRequestSchema.index({ customerId: 1, status: 1 });
refundRequestSchema.index({ status: 1, requestedAt: -1 });

module.exports = mongoose.models.RefundRequest || mongoose.model('RefundRequest', refundRequestSchema);

