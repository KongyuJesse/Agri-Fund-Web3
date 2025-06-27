const NGO = require('../models/Ngo');
const Application = require('../models/Application');
const User = require('../models/User');
const Farmer = require('../models/Farmer');
const Report = require('../models/Report');
const Contract = require('../models/Contract');
const Transaction = require('../models/Transaction');

/**
 * Retrieves the profile for the currently authenticated NGO user.
 */
exports.viewProfile = async (req, res, next) => {
  try {
    const ngo = await NGO.findOne({ user: req.user._id }).populate('user', 'email walletAddress');
    if (!ngo) {
      return res.status(404).json({ message: 'NGO profile not found.' });
    }
    res.json(ngo);
  } catch (err) {
    next(err);
  }
};

/**
 * Updates the NGO profile fields present in req.body.
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const updates = req.body;
    const ngo = await NGO.findOneAndUpdate(
      { user: req.user._id },
      updates,
      { new: true, runValidators: true }
    );
    if (!ngo) {
      return res.status(404).json({ message: 'NGO profile not found.' });
    }
    res.json({ message: 'Profile updated.', ngo });
  } catch (err) {
    next(err);
  }
};

/**
 * Retrieves all applications submitted to this NGO.
 */
exports.viewApplications = async (req, res, next) => {
  try {
    const ngoProfile = await NGO.findOne({ user: req.user._id });
    if (!ngoProfile) {
      return res.status(404).json({ message: 'NGO profile not found.' });
    }

    const applications = await Application.find({ ngo: ngoProfile._id })
      .populate({
        path: 'farmer',
        populate: { path: 'user', select: 'email' }
      })
      .sort({ applicationDate: -1 });

    res.json(applications);
  } catch (err) {
    next(err);
  }
};

/**
 * Updates the wallet address of the authenticated NGO user.
 */
exports.updateWalletAddress = async (req, res, next) => {
  try {
    const { walletAddress } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { walletAddress },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({ message: 'Wallet address updated.', user });
  } catch (err) {
    next(err);
  }
};

/**
 * Returns statistics for the NGO dashboard.
 */
exports.getNgoStats = async (req, res, next) => {
  try {
    const ngo = await NGO.findOne({ user: req.user._id });
    if (!ngo) {
      return res.status(404).json({ message: 'NGO profile not found.' });
    }

    const [applications, pending, approved, contracts, active, transactions] = await Promise.all([
      Application.countDocuments({ ngo: ngo._id }),
      Application.countDocuments({ ngo: ngo._id, status: 'Pending' }),
      Application.countDocuments({ ngo: ngo._id, status: 'Approved' }),
      Contract.countDocuments({ ngo: ngo._id }),
      Contract.countDocuments({ ngo: ngo._id, status: 'Active' }),
      Transaction.countDocuments({ from: req.user.walletAddress })
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

/**
 * Retrieves all farmers who have applied to this NGO, including their application status.
 */
exports.getFarmers = async (req, res, next) => {
  try {
    const ngo = await NGO.findOne({ user: req.user._id });
    if (!ngo) {
      return res.status(404).json({ message: 'NGO profile not found.' });
    }

    const applications = await Application.find({ ngo: ngo._id })
      .populate({
        path: 'farmer',
        populate: { path: 'user', select: 'email' }
      });

    const farmers = applications.map(app => ({
      ...app.farmer.toObject(),
      status: app.status
    }));

    res.json(farmers);
  } catch (err) {
    next(err);
  }
};

/**
 * Retrieves all reports submitted to this NGO.
 */
exports.getReports = async (req, res, next) => {
  try {
    const ngo = await NGO.findOne({ user: req.user._id });
    if (!ngo) {
      return res.status(404).json({ message: 'NGO profile not found.' });
    }

    const reports = await Report.find({ ngo: ngo._id })
      .populate('farmer', 'name user')
      .populate('contract', 'contractId')
      .sort({ date: -1 });

    res.json(reports);
  } catch (err) {
    next(err);
  }
};
