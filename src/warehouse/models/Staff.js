const mongoose = require('mongoose');

const StaffSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  role: {
    type: String,
    required: true,
    enum: ['Picker', 'Packer', 'Loader', 'Rider', 'Supervisor'],
    index: true,
  },
  zone: {
    type: String,
    default: null,
    trim: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['Active', 'Break', 'Meeting', 'Offline'],
    default: 'Offline',
    index: true,
  },
  currentShift: {
    type: String,
    default: null,
  },
  currentTask: {
    type: String,
    default: null,
    trim: true,
  },
}, {
  timestamps: true,
  collection: 'staff',
});

StaffSchema.index({ role: 1, status: 1 });
StaffSchema.index({ zone: 1 });


module.exports = mongoose.models.Staff || mongoose.model('Staff', StaffSchema);

