// server/routes/application.routes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const roleCheck = require('../middleware/roleCheck.middleware');
const applicationController = require('../controllers/application.controller');

// All application routes require JWT
router.use(protect);

// Farmer submits application
router.post('/apply', roleCheck(['Farmer']), applicationController.applyToNGO);

// Farmer views own applications
router.get('/my-applications', roleCheck(['Farmer']), applicationController.viewFarmerApplications);

// NGO/Admin updates status
router.put('/:applicationId/status', roleCheck(['NGO', 'Admin', 'SuperAdmin']), applicationController.updateApplicationStatus);

module.exports = router;
