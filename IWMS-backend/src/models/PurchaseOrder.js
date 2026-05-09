const mongoose = require('mongoose')

const purchaseOrderSchema = new mongoose.Schema({
  supplierName: { type: String, required: true },
  material: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  notes: { type: String },
  status: { type: String, enum: ['Pending', 'Approved', 'Received', 'Cancelled'], default: 'Pending' },
  receivedAt: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema)
