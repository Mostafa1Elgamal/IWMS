const mongoose = require('mongoose')
const invoiceSchema = new mongoose.Schema({
  jobOrder:{ type: mongoose.Schema.Types.ObjectId, ref: 'JobOrder', required: true },
  amount:{ type: Number, required: true },
  materialsCost:{ type: Number, default: 0 },
  laborCost:{ type: Number, default: 0 },
  extraCharges: [{ description: String, amount: Number }],
  amountPaid:{ type: Number, default: 0 },
  paymentStatus:{ type: String, enum: ['unpaid', 'partially-paid', 'paid'], default: 'unpaid' },
  dueDate: { type: Date },
  notes: { type: String, default: '' },
  auditLog: [{
    action:String, 
    changedBy:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    oldValue:mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    timestamp:{ type: Date, default: Date.now }
  }]
}, { timestamps: true })
module.exports = mongoose.model('Invoice', invoiceSchema)   