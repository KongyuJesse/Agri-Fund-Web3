const Message = require('../models/Message');
const User = require('../models/User');
const NGO = require('../models/Ngo');
const Farmer = require('../models/Farmer');
const Application = require('../models/Application'); // ✅ Ensure this is imported

// Send a message from NGO to Farmer
exports.sendMessage = async (req, res, next) => {
  try {
    const { receiver, content } = req.body;

    // Validate request body
    if (!receiver || !content || content.trim() === '') {
      return res.status(400).json({ message: 'Receiver and content are required.' });
    }

    // Find the farmer by ID and populate user reference
    const farmer = await Farmer.findById(receiver).populate('user');
    if (!farmer || !farmer.user) {
      return res.status(404).json({ message: 'Farmer not found or has no associated user.' });
    }

    // Get the NGO profile of the currently logged-in user
    const ngo = await NGO.findOne({ user: req.user._id });
    if (!ngo) {
      return res.status(404).json({ message: 'NGO profile not found.' });
    }

    // Check if an approved application exists between NGO and Farmer
    const hasApprovedApplication = await Application.exists({
      farmer: farmer._id,
      ngo: ngo._id,
      status: 'Approved',
    });

    if (!hasApprovedApplication) {
      return res.status(403).json({ message: 'No approved application between NGO and this farmer.' });
    }

    // Create and save the message
    const newMessage = new Message({
      sender: req.user._id,
      receiver: farmer.user._id,
      content: content.trim(),
    });

    await newMessage.save();

    // Emit socket event if io is available (for real-time updates)
    if (req.io) {
      req.io.to(farmer.user._id.toString()).emit('newMessage', newMessage);
    }

    res.status(201).json(newMessage);
  } catch (err) {
    next(err);
  }
};

// Get all messages between the current NGO user and a specific farmer
exports.getMessages = async (req, res, next) => {
  try {
    const { farmerId } = req.params;

    // Validate farmer ID and fetch
    const farmer = await Farmer.findById(farmerId).populate('user');
    if (!farmer || !farmer.user) {
      return res.status(404).json({ message: 'Farmer not found or has no associated user.' });
    }

    // Fetch messages between NGO and the farmer
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: farmer.user._id },
        { sender: farmer.user._id, receiver: req.user._id },
      ],
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    next(err);
  }
};
