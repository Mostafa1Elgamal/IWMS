const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  materials: [{ type: String }],
  contact: { type: String },
  email: { type: String },
  location: { type: String },
  rating: { type: Number, default: 5 },
  status: { type: String, default: 'Active' },
  totalOrders: { type: Number, default: 0 },
  lastOrder: { type: Date },
  reliability: { type: Number, default: 100 },
}, { timestamps: true });

module.exports = mongoose.model('Supplier', supplierSchema);
