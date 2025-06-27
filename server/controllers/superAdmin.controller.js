// server/controllers/superAdmin.controller.js
const SuperAdmin = require('../models/SuperAdmin');
const Admin = require('../models/Admin');
const Farmer = require('../models/Farmer');
const NGO = require('../models/Ngo');
const User = require('../models/User');
const AdminAuditLog = require('../models/AdminAuditLog');
const { sendEmail } = require('../utils/email');

// Get super admin profile
exports.getProfile = async (req, res, next) => {
  try {
    const superAdmin = await SuperAdmin.findOne({ user: req.user._id })
      .populate('user', 'email')
      .select('-__v');
    
    if (!superAdmin) {
      return res.status(404).json({ message: 'SuperAdmin profile not found' });
    }

    res.json({
      name: superAdmin.name,
      email: superAdmin.user.email,
      country: superAdmin.country,
      dob: superAdmin.dob,
      sex: superAdmin.sex,
      createdAt: superAdmin.createdAt
    });
  } catch (err) {
    next(err);
  }
};

// Get platform statistics
exports.getStats = async (req, res, next) => {
  try {
    const [admins, farmers, ngos, pendingFarmers, pendingNGOs, logs] = await Promise.all([
      User.countDocuments({ role: 'Admin', approved: true }),
      User.countDocuments({ role: 'Farmer', approved: true }),
      User.countDocuments({ role: 'NGO', approved: true }),
      User.countDocuments({ role: 'Farmer', approved: false }),
      User.countDocuments({ role: 'NGO', approved: false }),
      AdminAuditLog.countDocuments()
    ]);

    res.json({
      admins,
      farmers,
      ngos,
      pendingFarmers,
      pendingNGOs,
      logs
    });
  } catch (err) {
    next(err);
  }
};

// Get all admins
exports.getAllAdmins = async (req, res, next) => {
  try {
    const admins = await Admin.find()
      .populate('user', 'email')
      .sort({ createdAt: -1 });

    const formatted = admins.map(admin => ({
      _id: admin._id,
      name: admin.name,
      country: admin.country,
      dob: admin.dob,
      sex: admin.sex,
      user: {
        _id: admin.user._id,
        email: admin.user.email
      }
    }));

    res.json(formatted);
  } catch (err) {
    next(err);
  }
};

// Create new admin
exports.createAdmin = async (req, res, next) => {
  try {
    const { name, email, password, country, dob, sex } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Create user
    const newUser = await User.create({
      email,
      password,
      role: 'Admin',
      approved: true,
      sex
    });

    // Create admin profile
    const newAdmin = await Admin.create({
      user: newUser._id,
      name,
      country,
      dob: dob ? new Date(dob) : null,
      sex
    });

    // Log the action
    await AdminAuditLog.create({
      admin: req.user._id,
      action: `SuperAdmin created Admin ${newAdmin._id}`,
      target: newUser.email,
      details: `Admin created with email: ${newUser.email}`
    });

    // Send welcome email
    await sendEmail({
      to: email,
      subject: 'Your Admin Account Has Been Created',
      html: `<p>Hello ${name},</p>
             <p>Your admin account has been created by the SuperAdmin.</p>
             <p>You can now login using your email and password.</p>`
    });

    res.status(201).json({
      _id: newAdmin._id,
      name: newAdmin.name,
      country: newAdmin.country,
      dob: newAdmin.dob,
      sex: newAdmin.sex,
      user: {
        _id: newUser._id,
        email: newUser.email
      }
    });
  } catch (err) {
    next(err);
  }
};

// Update admin
exports.updateAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const admin = await Admin.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('user', 'email');

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Log the action
    await AdminAuditLog.create({
      admin: req.user._id,
      action: `SuperAdmin updated Admin ${id}`,
      target: admin.user.email,
      details: `Updated fields: ${Object.keys(updates).join(', ')}`
    });

    res.json({
      _id: admin._id,
      name: admin.name,
      country: admin.country,
      dob: admin.dob,
      sex: admin.sex,
      user: {
        _id: admin.user._id,
        email: admin.user.email
      }
    });
  } catch (err) {
    next(err);
  }
};

// Delete admin
exports.deleteAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const admin = await Admin.findById(id).populate('user', 'email');
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Log the action
    await AdminAuditLog.create({
      admin: req.user._id,
      action: `SuperAdmin deleted Admin ${id}`,
      target: admin.user.email,
      details: `Admin account permanently deleted`
    });

    // Delete admin and user
    await User.findByIdAndDelete(admin.user._id);
    await Admin.findByIdAndDelete(id);

    res.json({ message: 'Admin deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// Get all farmers (approved and pending)
exports.getAllFarmers = async (req, res, next) => {
  try {
    const farmers = await Farmer.find()
      .populate('user', 'email approved')
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
      action: `SuperAdmin approved Farmer ${farmer._id}`,
      target: farmer.user.email,
      details: `Farmer ID: ${farmer._id}`
    });

    // Notify farmer
    await sendEmail({
      to: farmer.user.email,
      subject: 'Account Approved',
      html: `<p>Your farmer account has been approved by the SuperAdmin. You can now access all features.</p>`
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
      action: `SuperAdmin rejected Farmer ${farmer._id}`,
      target: farmer.user.email,
      details: `Farmer ID: ${farmer._id}`
    });

    // Notify farmer
    await sendEmail({
      to: farmer.user.email,
      subject: 'Account Rejected',
      html: `<p>Your farmer account registration has been rejected by the SuperAdmin. Please contact support for more information.</p>`
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
      action: `SuperAdmin deleted Farmer ${farmer._id}`,
      target: farmer.user.email,
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

// Get all NGOs (approved and pending)
exports.getAllNGOs = async (req, res, next) => {
  try {
    const ngos = await NGO.find()
      .populate('user', 'email approved')
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
      action: `SuperAdmin approved NGO ${ngo._id}`,
      target: ngo.user.email,
      details: `NGO ID: ${ngo._id}`
    });

    // Notify NGO
    await sendEmail({
      to: ngo.user.email,
      subject: 'Account Approved',
      html: `<p>Your NGO account has been approved by the SuperAdmin. You can now access all features.</p>`
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
      action: `SuperAdmin rejected NGO ${ngo._id}`,
      target: ngo.user.email,
      details: `NGO ID: ${ngo._id}`
    });

    // Notify NGO
    await sendEmail({
      to: ngo.user.email,
      subject: 'Account Rejected',
      html: `<p>Your NGO account registration has been rejected by the SuperAdmin. Please contact support for more information.</p>`
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
      action: `SuperAdmin deleted NGO ${ngo._id}`,
      target: ngo.user.email,
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

// Get audit logs
exports.getAuditLogs = async (req, res, next) => {
  try {
    const logs = await AdminAuditLog.find()
      .populate({
        path: 'admin',
        populate: { path: 'user', select: 'email' }
      })
      .sort({ timestamp: -1 })
      .limit(100);

    const formatted = logs.map(log => ({
      _id: log._id,
      timestamp: log.timestamp,
      action: log.action,
      target: log.target,
      details: log.details,
      admin: log.admin ? {
        _id: log.admin._id,
        email: log.admin.user.email
      } : null
    }));

    res.json(formatted);
  } catch (err) {
    next(err);
  }
};