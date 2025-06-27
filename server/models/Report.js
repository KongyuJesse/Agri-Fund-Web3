const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
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
  contract: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contract'
  },
  date: {
    type: Date,
    default: Date.now
  },
  summary: {
    type: String,
    required: true
  },
  images: [String], // IPFS URLs
  challenges: String,
  nextSteps: String,
  status: {
    type: String,
    enum: ['Submitted', 'Reviewed', 'Completed'],
    default: 'Submitted'
  }
});

module.exports = mongoose.model('Report', reportSchema);