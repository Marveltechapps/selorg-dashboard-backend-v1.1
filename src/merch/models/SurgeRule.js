const mongoose = require('mongoose');
const { Schema } = mongoose;

const SurgeRuleSchema = new Schema({
  zone: { type: String, required: true },
  trigger: { type: String, required: true },
  multiplier: { type: String, required: true },
  active: { type: Boolean, default: true },
  minMult: { type: String, required: true },
  maxMult: { type: String, required: true }
}, {
  timestamps: true
});

module.exports = mongoose.models.SurgeRule || mongoose.model('SurgeRule', SurgeRuleSchema);
