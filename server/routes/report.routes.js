const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const roleCheck = require('../middleware/roleCheck.middleware');
const reportController = require('../controllers/report.controller');
const { multipleUpload } = require('../middleware/upload.middleware');

router.use(protect);

// NGO gets all reports
router.get('/', roleCheck(['NGO']), reportController.getReports);

// Farmer submits report
router.post(
  '/',
  roleCheck(['Farmer']),
  multipleUpload('images'),
  reportController.createReport
);

module.exports = router;