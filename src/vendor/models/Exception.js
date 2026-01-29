<<<<<<< HEAD
const mongoose = require('mongoose');

const ExceptionSchema = new mongoose.Schema(
  {
    grnId: { type: String, required: true },
    type: String,
    description: String,
    status: { type: String, default: 'OPEN' },
    resolvedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.models.Exception || mongoose.model('Exception', ExceptionSchema);

=======
const mongoose = require('mongoose');

const ExceptionSchema = new mongoose.Schema(
  {
    grnId: { type: String, required: true },
    type: String,
    description: String,
    status: { type: String, default: 'OPEN' },
    resolvedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.models.Exception || mongoose.model('Exception', ExceptionSchema);

>>>>>>> 6591dc33a9b88417e6a52adeaff72e27b1dee13a
