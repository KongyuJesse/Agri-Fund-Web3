// server/controllers/application.controller.js
const Application = require('../models/Application');
const Farmer = require('../models/Farmer');
const NGO = require('../models/Ngo');
const { sendEmail } = require('../utils/email');
const User = require('../models/User');
const { uploadMultipleToIPFS } = require('../utils/ipfs');

exports.applyToNGO = async (req, res, next) => {
  try {
    const { ngoId, projectTitle, projectDetails, budget, timeline } = req.body;
    const supportingDocs = req.body.supportingDocsUrls || [];

    // Find farmer profile
    const farmerProfile = await Farmer.findOne({ user: req.user._id }).populate('user', 'email');
    if (!farmerProfile) return res.status(404).json({ message: 'Farmer not found.' });

    const ngoProfile = await NGO.findById(ngoId).populate('user', 'email');
    if (!ngoProfile) return res.status(404).json({ message: 'NGO not found.' });

    const newApp = new Application({
      farmer: farmerProfile._id,
      ngo: ngoProfile._id,
      projectTitle,
      projectDetails,
      budget,
      timeline,
      supportingDocs
    });

    await newApp.save();

    // Notify NGO by email
    await sendEmail({
      to: ngoProfile.user.email,
      subject: 'New Application Received',
      html: `
        <p>You have received a new application from ${farmerProfile.user.email}.</p>
        <h3>Project Details:</h3>
        <p><strong>Title:</strong> ${projectTitle}</p>
        <p><strong>Budget:</strong> ${budget} ETH</p>
        <p><strong>Timeline:</strong> ${timeline}</p>
        <p>Please review the application in your dashboard.</p>
      `
    });

    res.status(201).json({ message: 'Application submitted.', application: newApp });
  } catch (err) {
    next(err);
  }
};

exports.viewFarmerApplications = async (req, res, next) => {
  try {
    const farmerProfile = await Farmer.findOne({ user: req.user._id });
    if (!farmerProfile) return res.status(404).json({ message: 'Farmer not found.' });

    const apps = await Application.find({ farmer: farmerProfile._id })
      .populate('ngo', 'ngoName')
      .sort({ applicationDate: -1 });
    res.json(apps);
  } catch (err) {
    next(err);
  }
};

exports.updateApplicationStatus = async (req, res, next) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body; // 'Approved' or 'Rejected'
    const app = await Application.findById(applicationId).populate('farmer').populate('ngo');
    if (!app) return res.status(404).json({ message: 'Application not found.' });

    app.status = status;
    await app.save();

    // Notify farmer via email
    const farmerUser = await User.findById(app.farmer.user);
    await sendEmail({
      to: farmerUser.email,
      subject: `Your Application has been ${status}`,
      html: `
        <p>Your application has been ${status} by ${app.ngo.ngoName}.</p>
        <h3>Project Details:</h3>
        <p><strong>Title:</strong> ${app.projectTitle}</p>
        <p><strong>Status:</strong> ${status}</p>
        ${status === 'Approved' ? '<p>You will be contacted shortly regarding next steps.</p>' : ''}
      `
    });

    res.json({ message: `Application ${status}.`, application: app });
  } catch (err) {
    next(err);
  }
};