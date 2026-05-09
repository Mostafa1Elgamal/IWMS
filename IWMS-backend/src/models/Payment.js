const mongoose = require('mongoose')

const paymentSchema = new mongoose.Schema({
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
  jobOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'JobOrder', required: true },
  amount: { type: Number, required: true, min: 0 },
  method: {
    type: String,
    enum: ['cash', 'vodafone_cash', 'card', 'bank_transfer'],
    required: true
  },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String, default: '' },
  paidAt: { type: Date, default: Date.now }
}, { timestamps: true })

module.exports = mongoose.model('Payment', paymentSchema)
