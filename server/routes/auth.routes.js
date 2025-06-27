// server/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const { registerNGO, registerFarmer, login } = require('../controllers/auth.controller');
const uploadAny = require('../middleware/anyUpload.middleware');

// Register NGO → expects a single file field "legalDocs"
router.post('/register-ngo', uploadAny, registerNGO);

// Register Farmer (individual or group) → accepts any file fields:
//  - individual: "photo", "idDoc", "supportingDocs"…
//  - group: nested "members[0][photo]", "members[0][idDoc]", etc., plus "supportingDocs"
router.post('/register-farmer', uploadAny, registerFarmer);

// Login
router.post('/login', login);

module.exports = router;
