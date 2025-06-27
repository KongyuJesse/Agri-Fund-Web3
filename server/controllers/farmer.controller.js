// server/controllers/farmer.controller.js

const Farmer = require('../models/Farmer');
const User = require('../models/User');
const NGO = require('../models/Ngo');
const Application = require('../models/Application');
const Contract = require('../models/Contract');
const Report = require('../models/Report');
const Transaction = require('../models/Transaction'); // Ensure you have this model
const { sendEmail } = require('../utils/email');

// View farmer profile
exports.viewProfile = async (req, res, next) => {
  try {
    const farmer = await Farmer.findOne({ user: req.user._id })
      .populate('user', 'email walletAddress')
      .populate('members');
    if (!farmer) return res.status(404).json({ message: 'Farmer profile not found.' });
    res.json(farmer);
  } catch (err) {
    next(err);
  }
};

// Update farmer profile
exports.updateProfile = async (req, res, next) => {
  try {
    const updates = req.body;
    const farmer = await Farmer.findOneAndUpdate(
      { user: req.user._id },
      updates,
      { new: true, runValidators: true }
    ).populate('user', 'email walletAddress');
    
    if (!farmer) return res.status(404).json({ message: 'Farmer profile not found.' });

    // Update wallet address in User model if provided
    if (updates.walletAddress) {
      await User.findByIdAndUpdate(
        req.user._id,
        { walletAddress: updates.walletAddress },
        { new: true }
      );
    }

    res.json({ message: 'Profile updated.', farmer });
  } catch (err) {
    next(err);
  }
};

// View available NGOs
exports.viewAvailableNGOs = async (req, res, next) => {
  try {
    // Fetch all NGOs with approved user accounts
    const ngoUsers = await User.find({ role: 'NGO', approved: true }).select('_id');
    const ngos = await NGO.find({ user: { $in: ngoUsers.map(u => u._id) } })
      .populate('user', 'email')
      .sort({ createdAt: -1 });
    res.json(ngos);
  } catch (err) {
    next(err);
  }
};

// View contracts for a farmer
exports.viewContracts = async (req, res, next) => {
  try {
    const farmerProfile = await Farmer.findOne({ user: req.user._id });
    if (!farmerProfile) return res.status(404).json({ message: 'Farmer profile not found.' });

    const contracts = await Contract.find({ farmer: farmerProfile._id })
      .populate({
        path: 'ngo',
        populate: { path: 'user', select: 'email' }
      })
      .sort({ createdAt: -1 });

    res.json(contracts);
  } catch (err) {
    next(err);
  }
};

// Get farmer statistics
exports.getFarmerStats = async (req, res, next) => {
  try {
    const farmer = await Farmer.findOne({ user: req.user._id });
    if (!farmer) return res.status(404).json({ message: 'Farmer profile not found.' });

    const [applications, pending, approved, contracts, active, transactions] = await Promise.all([
      Application.countDocuments({ farmer: farmer._id }),
      Application.countDocuments({ farmer: farmer._id, status: 'Pending' }),
      Application.countDocuments({ farmer: farmer._id, status: 'Approved' }),
      Contract.countDocuments({ farmer: farmer._id }),
      Contract.countDocuments({ farmer: farmer._id, status: 'Active' }),
      Transaction.countDocuments({ to: req.user.walletAddress }) // ensure this is how you store transactions
    ]);

    res.json({
      applications,
      pendingApplications: pending,
      approvedApplications: approved,
      contracts,
      activeContracts: active,
      transactions
    });
  } catch (err) {
    next(err);
  }
};
