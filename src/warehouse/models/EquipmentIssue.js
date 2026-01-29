<<<<<<< HEAD
const mongoose = require('mongoose');

const EquipmentIssueSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  equipmentId: { type: String, required: true, index: true },
  reportedBy: { type: String, required: true },
  description: { type: String, required: true },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  status: { type: String, enum: ['open', 'investigating', 'resolved'], default: 'open' },
  reportedAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date },
  resolutionNotes: { type: String }
}, { timestamps: true, collection: 'warehouse_equipment_issues' });

module.exports = mongoose.models.EquipmentIssue || mongoose.model('EquipmentIssue', EquipmentIssueSchema);

=======
const mongoose = require('mongoose');

const EquipmentIssueSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  equipmentId: { type: String, required: true, index: true },
  reportedBy: { type: String, required: true },
  description: { type: String, required: true },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  status: { type: String, enum: ['open', 'investigating', 'resolved'], default: 'open' },
  reportedAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date },
  resolutionNotes: { type: String }
}, { timestamps: true, collection: 'warehouse_equipment_issues' });

module.exports = mongoose.models.EquipmentIssue || mongoose.model('EquipmentIssue', EquipmentIssueSchema);

>>>>>>> 6591dc33a9b88417e6a52adeaff72e27b1dee13a
