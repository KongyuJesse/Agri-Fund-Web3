// server/models/SuperAdmin.js
const mongoose = require('mongoose');

const superAdminSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  country: {
    type: String,
    required: true
  },
  dob: {
    type: Date,
    required: true
  },
  sex: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SuperAdmin', superAdminSchema);
