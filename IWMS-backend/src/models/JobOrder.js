const mongoose = require('mongoose')
const jobOrderSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  dimensions: { height: Number, width: Number, thickness: Number },
  materialsUsed: [{
    material: { type: mongoose.Schema.Types.ObjectId, ref: 'Material' },
    quantity: { type: Number, required: true },
    cutOffUsed: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CutOff'}],
    mainStockDeducted: { type: Number, default: 0}
  }],
  status: {
    type: String,
    enum: [
      'pending', 'assigned', 'in-progress', 'waiting-for-parts',
      'technician-completed', 'ready-for-delivery', 'delivery-pending',
      'delivered', 'closed', 'cancelled'
    ],
    default: 'pending'
  },
  qrCode: String,
  totalCost: { type: Number, default: 0 },
  deliveryDate: Date,
  notes: String,
  deliveryConfirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deliveryConfirmedAt: Date,
  deliveryNotes: String,
}, { timestamps: true })
module.exports = mongoose.model('JobOrder', jobOrderSchema)