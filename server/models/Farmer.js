// server/models/Farmer.js
const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dob: { type: Date, required: true },
  occupation: { type: String, default: '' },
  education: { type: String, default: '' },
  address: { type: String, default: '' },
  bio: { type: String, default: '' },
  photoUrl: { type: String, required: true },   // IPFS URL
  idDocUrl: { type: String, required: true }    // IPFS URL
}, { _id: false });

const farmerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // *** NEW: top‐level “name” field ***
  name: {
    type: String,
    required: true,
    trim: true
  },

  occupation: {
    type: String,
    default: ''
  },
  education: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  country: {
    type: String,
    required: true
  },
  bio: {
    type: String,
    default: ''
  },
  photoUrl: {
    type: String,
    required: true
  },
  idDocUrl: {
    type: String,
    required: true
  },
  supportingDocsUrls: [{
    type: String // IPFS URLs
  }],
  // If group registration
  groupName: {
    type: String,
    default: ''
  },
  members: {
    type: [memberSchema],
    default: []
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

module.exports = mongoose.model('Farmer', farmerSchema);
