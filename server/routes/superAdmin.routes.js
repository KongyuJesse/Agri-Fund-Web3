// server/routes/superAdmin.routes.js

const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superAdmin.controller');
const { protect, superAdmin } = require('../middleware/auth.middleware');

// Protect all routes below this line – must be authenticated & SuperAdmin
router.use(protect, superAdmin);

// Profile
router.get('/profile', superAdminController.getProfile);

// Platform statistics
router.get('/stats', superAdminController.getStats);

// Admins management
router.get('/admins', superAdminController.getAllAdmins);
router.post('/admins', superAdminController.createAdmin);
router.put('/admins/:id', superAdminController.updateAdmin);
router.delete('/admins/:id', superAdminController.deleteAdmin);

// Farmers management
router.get('/farmers', superAdminController.getAllFarmers);
router.get('/pending/farmers', superAdminController.getPendingFarmers);
router.put('/farmers/:id/approve', superAdminController.approveFarmer);
router.delete('/farmers/:id/reject', superAdminController.rejectFarmer);
router.delete('/farmers/:id', superAdminController.deleteFarmer);

// NGOs management
router.get('/ngos', superAdminController.getAllNGOs);
router.get('/pending/ngos', superAdminController.getPendingNGOs);
router.put('/ngos/:id/approve', superAdminController.approveNGO);
router.delete('/ngos/:id/reject', superAdminController.rejectNGO);
router.delete('/ngos/:id', superAdminController.deleteNGO);

// Audit logs
router.get('/logs', superAdminController.getAuditLogs);

module.exports = router;
