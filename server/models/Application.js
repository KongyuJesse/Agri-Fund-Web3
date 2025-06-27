// server/models/Application.js
const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farmer',
    required: true
  },
  ngo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NGO',
    required: true
  },
  applicationDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  projectTitle: {
    type: String,
    required: true
  },
  projectDetails: {
    type: String,
    required: true
  },
  budget: {
    type: Number,
    required: true
  },
  timeline: {
    type: String,
    required: true
  },
  supportingDocs: [String], // IPFS URLs
  ipfsHash: {
    type: String,
    default: ''
  }
});

module.exports = mongoose.model('Application', applicationSchema);