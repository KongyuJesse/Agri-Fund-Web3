// server/controllers/upload.controller.js
const { uploadToIPFS } = require('../utils/ipfs');

exports.uploadContractFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    const result = await uploadToIPFS(req.file);
    
    res.json({ 
      success: true, 
      ipfsHash: result.ipfsHash,
      pinataUrl: result.pinataUrl 
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'File upload failed',
      error: err.message 
    });
  }
};