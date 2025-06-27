const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const roleCheck = require('../middleware/roleCheck.middleware');
const messageController = require('../controllers/message.controller');

router.use(protect);

// Send message
router.post('/', roleCheck(['NGO', 'Farmer']), messageController.sendMessage);

// Get conversation with farmer
router.get('/:farmerId', roleCheck(['NGO', 'Farmer']), messageController.getMessages);

module.exports = router;