const mongoose = require('mongoose');

const followUpSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  lastContact: { type: Date, default: Date.now },
  nextFollowUp: { type: Date, required: true },
  status: { type: String, enum: ['Scheduled', 'Pending', 'Overdue', 'Completed'], default: 'Scheduled' },
  notes: { type: String, default: '' },
  method: { type: String, enum: ['Phone', 'Email', 'Meeting', 'Other'], default: 'Phone' }
}, { timestamps: true });

module.exports = mongoose.model('FollowUp', followUpSchema);
