const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const roleCheck = require('../middleware/roleCheck.middleware');
const ngoController = require('../controllers/ngo.controller');

// All NGO routes require JWT + role 'NGO'
router.use(protect, roleCheck(['NGO']));

// Profile
router.get('/profile', ngoController.viewProfile);
router.put('/profile', ngoController.updateProfile);

// Applications
router.get('/applications', ngoController.viewApplications);

// Farmers
router.get('/farmers', ngoController.getFarmers);

// Stats
router.get('/stats', ngoController.getNgoStats);

// Update wallet address
router.put('/wallet', ngoController.updateWalletAddress);

// Reports
router.get('/reports', ngoController.getReports);

module.exports = router;
