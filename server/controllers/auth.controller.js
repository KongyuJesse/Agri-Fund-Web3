const User = require('../models/User');
const NGO = require('../models/Ngo');
const Farmer = require('../models/Farmer');
const Admin = require('../models/Admin');
const SuperAdmin = require('../models/SuperAdmin');
const { signToken } = require('../utils/jwt');
const { sendEmail } = require('../utils/email');
const { uploadToIPFS, uploadMultipleToIPFS } = require('../utils/ipfs');

// ✅ UPDATED NGO REGISTRATION
exports.registerNGO = async (req, res, next) => {
  try {
    const {
      email,
      password,
      ngoName,
      country,
      dateFounded,
      address,
      about,
      mission
    } = req.body;

    const legalFile = (req.files || []).find((f) => f.fieldname === 'legalDocs');

    if (!email || !password || !ngoName) {
      return res.status(400).json({ message: 'Email, password, and NGO name are required.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    let legalDocsUrl = '';
    if (legalFile) {
      const uploadedLegalFile = await uploadToIPFS(legalFile);
      legalDocsUrl = uploadedLegalFile.pinataUrl; // ✅ Extract URL from object
    }

    const newUser = await User.create({
      email,
      password,
      role: 'NGO',
      approved: false
    });

    const newNGO = await NGO.create({
      user: newUser._id,
      ngoName,
      country: country || '',
      dateFounded: dateFounded ? new Date(dateFounded) : undefined,
      address: address || '',
      about: about || '',
      mission: mission || '',
      legalDocsUrl
    });

    await sendEmail({
      to: email,
      subject: 'NGO Registration Received',
      html: `<p>Dear ${ngoName},<br>Your NGO registration has been received and is under review.</p>`
    });

    res.status(201).json({ message: 'NGO registered. Awaiting approval.', ngo: newNGO });
  } catch (err) {
    next(err);
  }
};

// ✅ FARMER REGISTRATION (unchanged)
exports.registerFarmer = async (req, res, next) => {
  try {
    const {
      email,
      password,
      name,
      occupation,
      education,
      address,
      country,
      bio,
      groupName,
      sex
    } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Email, password, and name are required.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    const newUser = await User.create({
      email,
      password,
      role: 'Farmer',
      approved: false,
      sex: sex || ''
    });

    const farmerData = {
      user: newUser._id,
      name: name.trim(),
      occupation: occupation || '',
      education: education || '',
      address: address || '',
      country: country || '',
      bio: bio || '',
      sex: sex || '',
      supportingDocsUrls: [],
      photoUrl: '',
      idDocUrl: ''
    };

    const allFiles = req.files || [];

    const photoFile = allFiles.find((f) => f.fieldname === 'photo');
    if (photoFile) {
      farmerData.photoUrl = await uploadToIPFS(photoFile);
    }

    const idDocFile = allFiles.find((f) => f.fieldname === 'idDoc');
    if (idDocFile) {
      farmerData.idDocUrl = await uploadToIPFS(idDocFile);
    }

    const supDocs = allFiles.filter((f) => f.fieldname === 'supportingDocs');
    if (supDocs.length) {
      farmerData.supportingDocsUrls = await uploadMultipleToIPFS(supDocs);
    }

    if (groupName) {
      const memberFiles = allFiles.filter((f) => f.fieldname.startsWith('members['));
      const membersMap = {};

      memberFiles.forEach((file) => {
        const m = file.fieldname.match(/^members\[(\d+)\]\[(photo|idDoc)\]$/);
        if (!m) return;
        const idx = Number(m[1]);
        const key = m[2];
        if (!membersMap[idx]) membersMap[idx] = {};
        membersMap[idx][key] = file;
      });

      const memberIndices = Object.keys(req.body)
        .map((k) => {
          const mm = k.match(/^members\[(\d+)\]\[name\]$/);
          return mm ? Number(mm[1]) : null;
        })
        .filter((i) => i !== null);
      const uniqueIndices = [...new Set(memberIndices)].sort((a, b) => a - b);

      const photoUrls = [];
      const idDocUrls = [];
      for (const idx of uniqueIndices) {
        const entry = membersMap[idx] || {};
        photoUrls[idx] = entry.photo ? await uploadToIPFS(entry.photo) : '';
        idDocUrls[idx] = entry.idDoc ? await uploadToIPFS(entry.idDoc) : '';
      }

      const membersArray = uniqueIndices.map((idx) => ({
        name: req.body[`members[${idx}][name]`] || '',
        dob: req.body[`members[${idx}][dob]`] ? new Date(req.body[`members[${idx}][dob]`]) : null,
        occupation: req.body[`members[${idx}][occupation]`] || '',
        education: req.body[`members[${idx}][education]`] || '',
        address: req.body[`members[${idx}][address]`] || '',
        bio: req.body[`members[${idx}][bio]`] || '',
        photoUrl: photoUrls[idx] || '',
        idDocUrl: idDocUrls[idx] || ''
      }));

      farmerData.groupName = groupName;
      farmerData.members = membersArray;
    }

    const newFarmer = await Farmer.create(farmerData);

    await sendEmail({
      to: email,
      subject: 'Farmer Registration Received',
      html: `<p>Dear ${name},<br>Your farmer registration has been received and is under review.</p>`
    });

    res.status(201).json({
      message: 'Farmer registered. Awaiting approval.',
      farmer: newFarmer
    });
  } catch (err) {
    next(err);
  }
};

// ✅ LOGIN FUNCTION
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    let user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials.' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials.' });

    if (user.role !== 'SuperAdmin' && !user.approved) {
      return res.status(403).json({ message: 'Account not approved.' });
    }

    let roleModel;
    switch (user.role) {
      case 'Admin':
        roleModel = Admin;
        break;
      case 'SuperAdmin':
        roleModel = SuperAdmin;
        break;
      case 'NGO':
        roleModel = NGO;
        break;
      case 'Farmer':
        roleModel = Farmer;
        break;
    }

    if (roleModel) {
      user = await User.findById(user._id).populate({
        path: 'roleData',
        model: roleModel
      });
    }

    const token = signToken(user);

    res.json({
      token,
      role: user.role,
      userId: user._id,
      user: {
        email: user.email,
        role: user.role,
        roleData: user.roleData || null
      }
    });
  } catch (err) {
    next(err);
  }
};
