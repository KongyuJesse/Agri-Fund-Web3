// server/controllers/report.controller.js

const Report = require('../models/Report');
const Farmer = require('../models/Farmer');
const NGO = require('../models/Ngo');
const Contract = require('../models/Contract');
const Application = require('../models/Application');
const { uploadMultipleToIPFS } = require('../utils/ipfs');
const { sendEmail } = require('../utils/email');

// Get reports submitted by the authenticated farmer
exports.getReports = async (req, res, next) => {
  try {
    const farmer = await Farmer.findOne({ user: req.user._id });
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer profile not found.' });
    }

    const reports = await Report.find({ farmer: farmer._id })
      .populate('ngo', 'ngoName')
      .populate('contract', 'contractId')
      .sort({ date: -1 });

    res.json(reports);
  } catch (err) {
    next(err);
  }
};

// Create a new report by a farmer
exports.createReport = async (req, res, next) => {
  try {
    const { contractId, summary, challenges, nextSteps } = req.body;
    const images = req.files || [];

    const farmer = await Farmer.findOne({ user: req.user._id });
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer profile not found.' });
    }

    let ngo = null;
    let contract = null;

    // Get contract and associated NGO if contractId is provided
    if (contractId) {
      contract = await Contract.findById(contractId).populate('ngo');
      if (!contract) {
        return res.status(404).json({ message: 'Contract not found.' });
      }
      ngo = contract.ngo;
    } else {
      // Get any approved NGO via application as fallback
      const app = await Application.findOne({ farmer: farmer._id, status: 'Approved' }).populate('ngo');
      if (app) ngo = app.ngo;
    }

    // Upload images to IPFS if provided
    let imageUrls = [];
    if (images.length > 0) {
      imageUrls = await uploadMultipleToIPFS(images);
    }

    // Create and save report
    const newReport = new Report({
      farmer: farmer._id,
      ngo: ngo?._id,
      contract: contract?._id,
      summary,
      images: imageUrls,
      challenges,
      nextSteps,
      date: new Date()
    });

    await newReport.save();

    // Notify the NGO via email
    if (ngo && ngo.user?.email) {
      await sendEmail({
        to: ngo.user.email,
        subject: 'New Report Submitted',
        html: `
          <p>A new report has been submitted by <strong>${farmer.name}</strong>.</p>
          <p><strong>Summary:</strong> ${summary.substring(0, 100)}...</p>
          ${contract ? `<p><strong>Contract ID:</strong> ${contract.contractId}</p>` : ''}
        `
      });
    }

    res.status(201).json({ message: 'Report submitted.', report: newReport });
  } catch (err) {
    next(err);
  }
};
