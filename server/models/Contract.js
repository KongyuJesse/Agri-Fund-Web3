// server/models/Contract.js
const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema({
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
  contractId: {
    type: String,
    required: true,
    unique: true
  },
  amount: {
    type: Number,
    required: true
  },
  ipfsHash: {
    type: String, // points to signed agreement stored on IPFS
    required: true
  },
  status: {
    type: String,
    enum: ['Created', 'SignedByFarmer', 'SignedByNGO', 'Active', 'Completed'],
    default: 'Created'
  },
  signatures: {
    farmerSigned: { type: Boolean, default: false },
    ngoSigned: { type: Boolean, default: false }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
});

// Update updatedAt on save
contractSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Contract', contractSchema);
