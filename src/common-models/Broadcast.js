
const mongoose = require('mongoose');

const BroadcastSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    index: true,
  },
  documentType: {
    type: String,
    default: 'broadcast',
    index: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
  },
  recipients: {
    type: [String],
    required: true,
  },
  priority: {
    type: String,
    enum: ['normal', 'high', 'urgent'],
    default: 'normal',
  },
  status: {
    type: String,
    enum: ['sent', 'pending', 'failed'],
    default: 'pending',
    index: true,
  },
  sentCount: {
    type: Number,
    default: 0,
  },
  failedCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
  collection: 'messages', // Reuse existing messages collection to avoid hitting MongoDB collection limit
});

// Compound unique index on id + documentType to avoid conflicts with messages in same collection
BroadcastSchema.index({ id: 1, documentType: 1 }, { unique: true });
BroadcastSchema.index({ status: 1, createdAt: -1 });
BroadcastSchema.index({ documentType: 1, status: 1 }); // For querying broadcasts specifically

const Broadcast = mongoose.model('Broadcast', BroadcastSchema);

module.exports = Broadcast;
