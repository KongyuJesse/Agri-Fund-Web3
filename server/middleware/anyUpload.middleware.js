// server/middleware/anyUpload.middleware.js
const multer = require('multer');

// Store all uploads in memory, since we immediately forward to IPFS
const storage = multer.memoryStorage();

// Only allow certain MIME types and 5 MB max per file
const fileFilter = (req, file, cb) => {
  const allowed = [
    'image/jpeg',
    'image/png',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Invalid file type.'), false);
};

const uploadAny = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).any(); // accept all file fields

module.exports = uploadAny;
