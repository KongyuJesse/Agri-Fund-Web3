const multer = require('multer');
const { uploadToIPFS, uploadMultipleToIPFS } = require('../utils/ipfs.js');

// Use memory storage so we can send the buffer directly to IPFS
const storage = multer.memoryStorage();

// Accept only certain MIME types and limit file size to 5 MB
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
});

/**
 * Single-file upload → IPFS metadata in req.body[fieldName + "Url"] and req.body[fieldName + "Hash"]
 */
const singleUpload = (fieldName) => [
  upload.single(fieldName), // This must match the field name used in FormData
  async (req, res, next) => {
    if (!req.file) return next();
    try {
      const { ipfsHash, pinataUrl } = await uploadToIPFS(req.file);
      req.body[`${fieldName}Url`] = pinataUrl;
      req.body[`${fieldName}Hash`] = ipfsHash;
      next();
    } catch (err) {
      next(err);
    }
  }
];

/**
 * Multiple-file upload → IPFS URLs array in req.body[fieldName + "Urls"]
 */
const multipleUpload = (fieldName) => [
  upload.array(fieldName),
  async (req, res, next) => {
    if (!req.files || !req.files.length) return next();
    try {
      const urls = await uploadMultipleToIPFS(req.files);
      req.body[`${fieldName}Urls`] = urls;
      next();
    } catch (err) {
      next(err);
    }
  }
];

module.exports = { singleUpload, multipleUpload };
