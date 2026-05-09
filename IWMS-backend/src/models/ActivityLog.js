const mongoose = require('mongoose')

const activityLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: String,
  userRole: String,
  actionType: {
    type: String,
    enum: [
      'order_created', 'order_status_changed', 'order_deleted',
      'invoice_generated', 'payment_recorded',
      'delivery_confirmed',
      'technician_started', 'technician_completed', 'technician_note',
      'extra_charge_added', 'invoice_marked_paid'
    ],
    required: true
  },
  targetType: {
    type: String,
    enum: ['order', 'invoice', 'payment'],
    required: true
  },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  description: { type: String, required: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true })

module.exports = mongoose.model('ActivityLog', activityLogSchema)
