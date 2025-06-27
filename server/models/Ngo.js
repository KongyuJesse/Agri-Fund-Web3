// server/models/NGO.js
const mongoose = require('mongoose');

const ngoSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ngoName: {
    type: String,
    required: true,
    trim: true
  },
  country: {
    type: String,
    required: true
  },
  dateFounded: {
    type: Date,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  about: {
    type: String,
    required: true
  },
  mission: {
    type: String,
    required: true
  },
  legalDocsUrl: {
    type: String, // IPFS URL
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('NGO', ngoSchema);
