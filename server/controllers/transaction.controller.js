// server/controllers/transaction.controller.js
const Transaction = require('../models/Transaction');
const Farmer = require('../models/Farmer');
const NGO = require('../models/Ngo');

exports.viewTransactionsByUser = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const farmerProfile = await Farmer.findOne({ user: userId }).populate('user', 'walletAddress');
    if (farmerProfile) {
      const txs = await Transaction.find({ to: farmerProfile.user.walletAddress })
        .sort({ timestamp: -1 });
      return res.json(txs);
    }

    const ngoProfile = await NGO.findOne({ user: userId }).populate('user', 'walletAddress');
    if (ngoProfile) {
      const txs = await Transaction.find({ from: ngoProfile.user.walletAddress })
        .sort({ timestamp: -1 });
      return res.json(txs);
    }

    return res.status(404).json({ message: 'No farmer or NGO profile found.' });
  } catch (err) {
    next(err);
  }
};
