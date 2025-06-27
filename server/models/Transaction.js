// server/models/Transaction.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  from: {
    type: String, // wallet address
    required: true
  },
  to: {
    type: String, // wallet address
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  txHash: {
    type: String,
    required: true,
    unique: true
  },
  contract: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contract'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Transaction', transactionSchema);
