// server/routes/farmer.routes.js

const express = require('express');
const router = express.Router();
const farmerController = require('../controllers/farmer.controller');
const { protect } = require('../middleware/auth.middleware');
const  roleCheck  = require('../middleware/roleCheck.middleware');
const { multipleUpload } = require('../middleware/upload.middleware');

// All Farmer routes require authentication and Farmer role
router.use(protect, roleCheck(['Farmer']));


// Profile routes
router.get('/profile', farmerController.viewProfile);
router.put('/profile', farmerController.updateProfile);

// NGO routes
router.get('/available-ngos', farmerController.viewAvailableNGOs);

// Contract routes
router.get('/contracts', farmerController.viewContracts);

// Farmer dashboard stats
router.get('/stats', farmerController.getFarmerStats);

module.exports = router;
