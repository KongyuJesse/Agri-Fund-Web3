// server/routes/transaction.routes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const roleCheck = require('../middleware/roleCheck.middleware');
const transactionController = require('../controllers/transaction.controller');

// All transaction routes require JWT + role 'Farmer' OR 'NGO'
router.use(protect, roleCheck(['Farmer', 'NGO']));

router.get('/me', transactionController.viewTransactionsByUser);

module.exports = router;
