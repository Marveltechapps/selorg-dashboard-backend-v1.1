<<<<<<< HEAD
const mongoose = require('mongoose');

const WarehouseAttendanceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  staffId: { type: String, required: true, index: true },
  status: { type: String, enum: ['check-in', 'check-out'], required: true },
  timestamp: { type: Date, default: Date.now },
  location: { type: String, default: 'Main Gate' }
}, { timestamps: true, collection: 'warehouse_attendance' });

module.exports = mongoose.models.WarehouseAttendance || mongoose.model('WarehouseAttendance', WarehouseAttendanceSchema);

=======
const mongoose = require('mongoose');

const WarehouseAttendanceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  staffId: { type: String, required: true, index: true },
  status: { type: String, enum: ['check-in', 'check-out'], required: true },
  timestamp: { type: Date, default: Date.now },
  location: { type: String, default: 'Main Gate' }
}, { timestamps: true, collection: 'warehouse_attendance' });

module.exports = mongoose.models.WarehouseAttendance || mongoose.model('WarehouseAttendance', WarehouseAttendanceSchema);

>>>>>>> 6591dc33a9b88417e6a52adeaff72e27b1dee13a
