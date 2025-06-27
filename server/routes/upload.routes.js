// server/routes/upload.routes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { singleUpload, multipleUpload } = require('../middleware/upload.middleware');
const { uploadToIPFS } = require('../utils/ipfs');
const uploadController = require('../controllers/upload.controller');

// =====================
// PUBLIC ROUTES
// =====================

// Upload a single file to IPFS via middleware
// Expects: multipart/form-data with field "file"
router.post('/single', singleUpload('file'), (req, res) => {
  if (!req.body.fileUrl) {
    return res.status(400).json({ message: 'File upload failed.' });
  }
  res.json({ fileUrl: req.body.fileUrl });
});

// Upload multiple files to IPFS via middleware
// Expects: multipart/form-data with field "files" (array)
router.post('/multiple', multipleUpload('files'), (req, res) => {
  if (!req.body.filesUrls) {
    return res.status(400).json({ message: 'Files upload failed.' });
  }
  res.json({ filesUrls: req.body.filesUrls });
});

// =====================
// PROTECTED ROUTES
// =====================
router.use(protect);

// Upload a contract file directly using uploadToIPFS utility
router.post('/contract', singleUpload('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const ipfsUrl = await uploadToIPFS(req.file);
    res.json({ ipfsHash: ipfsUrl });
  } catch (err) {
    next(err);
  }
});

// Upload a signature file directly using uploadToIPFS utility
router.post('/signature', singleUpload('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const ipfsUrl = await uploadToIPFS(req.file);
    res.json({ ipfsHash: ipfsUrl });
  } catch (err) {
    next(err);
  }
});

// =====================
// CONTROLLER-BASED ROUTE
// =====================

// Upload contract using controller logic
router.post('/contract/controller', protect, singleUpload('file'), uploadController.uploadContractFile);

module.exports = router;
