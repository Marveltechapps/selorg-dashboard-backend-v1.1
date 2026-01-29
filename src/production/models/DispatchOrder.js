<<<<<<< HEAD
const mongoose = require('mongoose');

const dispatchOrderSchema = new mongoose.Schema(
  {
    dispatch_id: {
      type: String,
      required: true,
    },
    order_id: {
      type: String,
      required: true,
    },
    rider_id: {
      type: String,
      required: false,
    },
    assigned_at: {
      type: String,
      required: true,
    },
    store_id: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: false,
  }
);

dispatchOrderSchema.index({ dispatch_id: 1, order_id: 1 });
dispatchOrderSchema.index({ order_id: 1 });
dispatchOrderSchema.index({ rider_id: 1 });

module.exports = mongoose.models.DispatchOrder || mongoose.model('DispatchOrder', dispatchOrderSchema);

=======
const mongoose = require('mongoose');

const dispatchOrderSchema = new mongoose.Schema(
  {
    dispatch_id: {
      type: String,
      required: true,
    },
    order_id: {
      type: String,
      required: true,
    },
    rider_id: {
      type: String,
      required: false,
    },
    assigned_at: {
      type: String,
      required: true,
    },
    store_id: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: false,
  }
);

dispatchOrderSchema.index({ dispatch_id: 1, order_id: 1 });
dispatchOrderSchema.index({ order_id: 1 });
dispatchOrderSchema.index({ rider_id: 1 });

module.exports = mongoose.models.DispatchOrder || mongoose.model('DispatchOrder', dispatchOrderSchema);

>>>>>>> 6591dc33a9b88417e6a52adeaff72e27b1dee13a
