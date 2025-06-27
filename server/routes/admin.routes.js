// server/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { protect, admin } = require('../middleware/auth.middleware');

// Admin profile
router.get('/profile', protect, admin, adminController.getAdminProfile);

// Platform stats
router.get('/stats', protect, admin, adminController.getPlatformStats);

// Farmers management
router.get('/farmers', protect, admin, adminController.getAllFarmers);
router.get('/pending/farmers', protect, admin, adminController.getPendingFarmers);
router.put('/farmers/:id/approve', protect, admin, adminController.approveFarmer);
router.delete('/farmers/:id/reject', protect, admin, adminController.rejectFarmer);
router.delete('/farmers/:id', protect, admin, adminController.deleteFarmer);

// NGOs management
router.get('/ngos', protect, admin, adminController.getAllNGOs);
router.get('/pending/ngos', protect, admin, adminController.getPendingNGOs);
router.put('/ngos/:id/approve', protect, admin, adminController.approveNGO);
router.delete('/ngos/:id/reject', protect, admin, adminController.rejectNGO);
router.delete('/ngos/:id', protect, admin, adminController.deleteNGO);

// Applications and contracts
router.get('/applications', protect, admin, adminController.getAllApplications);
router.get('/contracts', protect, admin, adminController.getAllContracts);

// Audit logs
router.get('/logs', protect, admin, adminController.getAuditLogs);

module.exports = router;