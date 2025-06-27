// server/models/AdminAuditLog.js
const mongoose = require('mongoose');

const adminAuditLogSchema = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  action: {
    type: String,
    required: true, // e.g. 'Approved Farmer X', 'Declined NGO Y'
    trim: true
  },
  details: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('AdminAuditLog', adminAuditLogSchema);
