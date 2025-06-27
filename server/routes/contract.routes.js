const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const roleCheck = require('../middleware/roleCheck.middleware');
const contractController = require('../controllers/contract.controller');
const { singleUpload, multipleUpload } = require('../middleware/upload.middleware');

// All contract routes require JWT authentication
router.use(protect);

/**
 * @route   POST /api/contracts
 * @desc    Create a new contract (NGO only)
 */
router.post(
  '/',
  roleCheck(['NGO']),
  contractController.createContract
);

/**
 * @route   GET /api/contracts
 * @desc    Get all contracts for the current user (NGO or Farmer)
 */
router.get(
  '/',
  roleCheck(['NGO', 'Farmer']),
  contractController.getContracts
);

/**
 * @route   GET /api/contracts/:id
 * @desc    Get a specific contract by ID (NGO or Farmer)
 */
router.get(
  '/:id',
  roleCheck(['NGO', 'Farmer']),
  contractController.getContract
);

/**
 * @route   POST /api/contracts/:id/sign
 * @desc    Sign a contract (NGO or Farmer)
 * @field   signatureFile (FormData)
 */
router.post(
  '/:id/sign',
  roleCheck(['Farmer', 'NGO']),
  singleUpload('signatureFile'),
  contractController.signContract
);

/**
 * @route   POST /api/contracts/:id/disburse
 * @desc    Disburse funds for a contract (NGO only)
 */
router.post(
  '/:id/disburse',
  roleCheck(['NGO']),
  (req, res, next) => {
    if (!req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'Contract ID is required'
      });
    }
    next();
  },
  contractController.disburseFunds
);

/**
 * @route   POST /api/contracts/:id/milestones
 * @desc    Record a milestone in a contract (Farmer only)
 * @field   files[] (FormData)
 */
router.post(
  '/:id/milestones',
  roleCheck(['Farmer']),
  multipleUpload('files'),
  contractController.recordMilestone
);

/**
 * @route   POST /api/contracts/:id/complete
 * @desc    Mark a contract as completed (NGO only)
 */
router.post(
  '/:id/complete',
  roleCheck(['NGO']),
  contractController.markComplete
);

module.exports = router;
