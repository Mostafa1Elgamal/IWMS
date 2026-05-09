const mongoose = require('mongoose')
const cutOffSchema = new mongoose.Schema({
  material: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
  dimensions: { height: Number, width: Number, thickness: Number },
  status: { type: String, enum: ['available', 'used'], default: 'available' }
}, { timestamps: true })
module.exports = mongoose.model('CutOff', cutOffSchema)