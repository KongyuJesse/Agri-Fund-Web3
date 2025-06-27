// server/controllers/admin.controller.js
const Admin = require('../models/Admin');
const Farmer = require('../models/Farmer');
const NGO = require('../models/Ngo');
const User = require('../models/User');
const AdminAuditLog = require('../models/AdminAuditLog');
const Application = require('../models/Application');
const Contract = require('../models/Contract');
const { sendEmail } = require('../utils/email');

// Get admin profile
exports.getAdminProfile = async (req, res, next) => {
  try {
    const admin = await Admin.findOne({ user: req.user._id })
      .populate('user', 'email')
      .select('-__v');
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin profile not found' });
    }

    res.json({
      name: admin.name,
      email: admin.user.email,
      country: admin.country,
      dob: admin.dob,
      sex: admin.sex,
      createdAt: admin.createdAt
    });
  } catch (err) {
    next(err);
  }
};

// Get platform statistics
exports.getPlatformStats = async (req, res, next) => {
  try {
    const [farmers, ngos, pendingFarmers, pendingNGOs, applications, contracts] = await Promise.all([
      User.countDocuments({ role: 'Farmer', approved: true }),
      User.countDocuments({ role: 'NGO', approved: true }),
      User.countDocuments({ role: 'Farmer', approved: false }),
      User.countDocuments({ role: 'NGO', approved: false }),
      Application.countDocuments(),
      Contract.countDocuments()
    ]);

    res.json({
      farmers,
      ngos,
      pendingFarmers,
      pendingNGOs,
      applications,
      contracts
    });
  } catch (err) {
    next(err);
  }
};

// Get all farmers
exports.getAllFarmers = async (req, res, next) => {
  try {
    const farmers = await Farmer.find()
      .populate('user', 'email')
      .sort({ createdAt: -1 });

    res.json(farmers);
  } catch (err) {
    next(err);
  }
};

// Get pending farmers
exports.getPendingFarmers = async (req, res, next) => {
  try {
    const pendingUsers = await User.find({ role: 'Farmer', approved: false }).select('_id');
    const farmers = await Farmer.find({ user: { $in: pendingUsers.map(u => u._id) } })
      .populate('user', 'email')
      .sort({ createdAt: -1 });

    res.json(farmers);
  } catch (err) {
    next(err);
  }
};

// Get all NGOs
exports.getAllNGOs = async (req, res, next) => {
  try {
    const ngos = await NGO.find()
      .populate('user', 'email')
      .sort({ createdAt: -1 });

    res.json(ngos);
  } catch (err) {
    next(err);
  }
};

// Get pending NGOs
exports.getPendingNGOs = async (req, res, next) => {
  try {
    const pendingUsers = await User.find({ role: 'NGO', approved: false }).select('_id');
    const ngos = await NGO.find({ user: { $in: pendingUsers.map(u => u._id) } })
      .populate('user', 'email')
      .sort({ createdAt: -1 });

    res.json(ngos);
  } catch (err) {
    next(err);
  }
};

// Approve farmer
exports.approveFarmer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const farmer = await Farmer.findById(id).populate('user');
    
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer not found' });
    }

    farmer.user.approved = true;
    await farmer.user.save();

    // Log the action
    await AdminAuditLog.create({
      admin: req.user._id,
      action: `Approved Farmer ${farmer.user.email}`,
      details: `Farmer ID: ${farmer._id}`
    });

    // Notify farmer
    await sendEmail({
      to: farmer.user.email,
      subject: 'Account Approved',
      html: `<p>Your farmer account has been approved. You can now access all features.</p>`
    });

    res.json({ message: 'Farmer approved successfully' });
  } catch (err) {
    next(err);
  }
};

// Reject farmer
exports.rejectFarmer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const farmer = await Farmer.findById(id).populate('user');
    
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer not found' });
    }

    // Log the action
    await AdminAuditLog.create({
      admin: req.user._id,
      action: `Rejected Farmer ${farmer.user.email}`,
      details: `Farmer ID: ${farmer._id}`
    });

    // Notify farmer
    await sendEmail({
      to: farmer.user.email,
      subject: 'Account Rejected',
      html: `<p>Your farmer account registration has been rejected. Please contact support for more information.</p>`
    });

    // Delete farmer and user
    await User.findByIdAndDelete(farmer.user._id);
    await Farmer.findByIdAndDelete(farmer._id);

    res.json({ message: 'Farmer rejected and deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// Delete farmer
exports.deleteFarmer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const farmer = await Farmer.findById(id).populate('user');
    
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer not found' });
    }

    // Log the action
    await AdminAuditLog.create({
      admin: req.user._id,
      action: `Deleted Farmer ${farmer.user.email}`,
      details: `Farmer ID: ${farmer._id}`
    });

    // Delete farmer and user
    await User.findByIdAndDelete(farmer.user._id);
    await Farmer.findByIdAndDelete(farmer._id);

    res.json({ message: 'Farmer deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// Approve NGO
exports.approveNGO = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ngo = await NGO.findById(id).populate('user');
    
    if (!ngo) {
      return res.status(404).json({ message: 'NGO not found' });
    }

    ngo.user.approved = true;
    await ngo.user.save();

    // Log the action
    await AdminAuditLog.create({
      admin: req.user._id,
      action: `Approved NGO ${ngo.ngoName}`,
      details: `NGO ID: ${ngo._id}`
    });

    // Notify NGO
    await sendEmail({
      to: ngo.user.email,
      subject: 'Account Approved',
      html: `<p>Your NGO account has been approved. You can now access all features.</p>`
    });

    res.json({ message: 'NGO approved successfully' });
  } catch (err) {
    next(err);
  }
};

// Reject NGO
exports.rejectNGO = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ngo = await NGO.findById(id).populate('user');
    
    if (!ngo) {
      return res.status(404).json({ message: 'NGO not found' });
    }

    // Log the action
    await AdminAuditLog.create({
      admin: req.user._id,
      action: `Rejected NGO ${ngo.ngoName}`,
      details: `NGO ID: ${ngo._id}`
    });

    // Notify NGO
    await sendEmail({
      to: ngo.user.email,
      subject: 'Account Rejected',
      html: `<p>Your NGO account registration has been rejected. Please contact support for more information.</p>`
    });

    // Delete NGO and user
    await User.findByIdAndDelete(ngo.user._id);
    await NGO.findByIdAndDelete(ngo._id);

    res.json({ message: 'NGO rejected and deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// Delete NGO
exports.deleteNGO = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ngo = await NGO.findById(id).populate('user');
    
    if (!ngo) {
      return res.status(404).json({ message: 'NGO not found' });
    }

    // Log the action
    await AdminAuditLog.create({
      admin: req.user._id,
      action: `Deleted NGO ${ngo.ngoName}`,
      details: `NGO ID: ${ngo._id}`
    });

    // Delete NGO and user
    await User.findByIdAndDelete(ngo.user._id);
    await NGO.findByIdAndDelete(ngo._id);

    res.json({ message: 'NGO deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// Get all applications
exports.getAllApplications = async (req, res, next) => {
  try {
    const applications = await Application.find()
      .populate('farmer', 'name')
      .populate('ngo', 'ngoName')
      .sort({ applicationDate: -1 });

    res.json(applications);
  } catch (err) {
    next(err);
  }
};

// Get all contracts
exports.getAllContracts = async (req, res, next) => {
  try {
    const contracts = await Contract.find()
      .populate('farmer', 'name')
      .populate('ngo', 'ngoName')
      .sort({ createdAt: -1 });

    res.json(contracts);
  } catch (err) {
    next(err);
  }
};

// Get audit logs
exports.getAuditLogs = async (req, res, next) => {
  try {
    const logs = await AdminAuditLog.find()
      .populate('admin', 'name')
      .sort({ timestamp: -1 })
      .limit(100);

    res.json(logs);
  } catch (err) {
    next(err);
  }
};