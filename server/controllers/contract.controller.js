const Contract = require('../models/Contract');
const Farmer = require('../models/Farmer');
const NGO = require('../models/Ngo');
const Application = require('../models/Application');
const Transaction = require('../models/Transaction');
const { uploadToIPFS, uploadMultipleToIPFS } = require('../utils/ipfs');
const { sendEmail } = require('../utils/email');
const { sendTokens } = require('../utils/wallet');

// Create Contract
exports.createContract = async (req, res) => {
  try {
    const { farmerId, amount, ipfsHash } = req.body;
    const ipfsHashString = ipfsHash?.ipfsHash || ipfsHash?.pinataUrl || ipfsHash;

    if (!farmerId || !amount || !ipfsHashString) {
      return res.status(400).json({
        success: false,
        message: 'Farmer ID, amount, and IPFS hash are required'
      });
    }

    const ngo = await NGO.findOne({ user: req.user._id });
    if (!ngo) return res.status(404).json({ success: false, message: 'NGO profile not found' });

    const farmer = await Farmer.findById(farmerId);
    if (!farmer) return res.status(404).json({ success: false, message: 'Farmer not found' });

    const contractId = `CTR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const fullIpfsUrl = ipfsHashString.startsWith('http')
      ? ipfsHashString
      : `https://gateway.pinata.cloud/ipfs/${ipfsHashString}`;

    const contract = await Contract.create({
      farmer: farmerId,
      ngo: ngo._id,
      contractId,
      amount: parseFloat(amount),
      ipfsHash: fullIpfsUrl,
      status: 'Created'
    });

    const populatedContract = await Contract.findById(contract._id)
      .populate('farmer', 'name user')
      .populate('ngo', 'ngoName user');

    res.status(201).json({ success: true, data: populatedContract });
  } catch (err) {
    console.error('Error creating contract:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Get Contracts
exports.getContracts = async (req, res, next) => {
  try {
    const query = {};
    if (req.user.role === 'NGO') {
      const ngo = await NGO.findOne({ user: req.user._id });
      if (!ngo) return res.status(404).json({ message: 'NGO profile not found' });
      query.ngo = ngo._id;
    } else {
      const farmer = await Farmer.findOne({ user: req.user._id });
      if (!farmer) return res.status(404).json({ message: 'Farmer profile not found' });
      query.farmer = farmer._id;
    }

    const contracts = await Contract.find(query)
      .populate({ path: 'farmer', select: 'name user', populate: { path: 'user', select: 'email' } })
      .populate({ path: 'ngo', select: 'ngoName user', populate: { path: 'user', select: 'email walletAddress' } })
      .sort({ createdAt: -1 });

    res.json(contracts);
  } catch (err) {
    console.error('Error getting contracts:', err);
    next(err);
  }
};

// Get Single Contract
exports.getContract = async (req, res, next) => {
  try {
    const contract = await Contract.findById(req.params.id)
      .populate('farmer', 'name user')
      .populate('ngo', 'ngoName user');

    if (!contract) return res.status(404).json({ message: 'Contract not found' });

    if (req.user.role === 'NGO') {
      const ngo = await NGO.findOne({ user: req.user._id });
      if (!ngo || !contract.ngo.equals(ngo._id)) return res.status(403).json({ message: 'Unauthorized access' });
    } else {
      const farmer = await Farmer.findOne({ user: req.user._id });
      if (!farmer || !contract.farmer.equals(farmer._id)) return res.status(403).json({ message: 'Unauthorized access' });
    }

    res.json(contract);
  } catch (err) {
    next(err);
  }
};

// Sign Contract
exports.signContract = async (req, res, next) => {
  try {
    const { contractId, signerRole } = req.body;
    const signatureFile = req.file;

    if (!contractId || !signerRole || !signatureFile) {
      return res.status(400).json({ success: false, message: 'Contract ID, signer role, and signature file are required.' });
    }

    const contract = await Contract.findOne({ contractId })
      .populate('farmer', 'user')
      .populate({ path: 'ngo', populate: { path: 'user', select: 'email' } });

    if (!contract) return res.status(404).json({ success: false, message: 'Contract not found.' });

    if (signerRole === 'Farmer') {
      const farmer = await Farmer.findOne({ user: req.user._id });
      if (!farmer || !contract.farmer.equals(farmer._id)) return res.status(403).json({ success: false, message: 'Unauthorized to sign as farmer.' });
    } else if (signerRole === 'NGO') {
      const ngo = await NGO.findOne({ user: req.user._id });
      if (!ngo || !contract.ngo.equals(ngo._id)) return res.status(403).json({ success: false, message: 'Unauthorized to sign as NGO.' });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid signer role.' });
    }

    const ipfsData = await uploadToIPFS(signatureFile);
    const signatureUrl = ipfsData.pinataUrl;

    if (signerRole === 'Farmer') {
      contract.signatures.farmerSigned = true;
      contract.signatures.farmerSignatureUrl = signatureUrl;
    } else {
      contract.signatures.ngoSigned = true;
      contract.signatures.ngoSignatureUrl = signatureUrl;
    }

    if (contract.signatures.farmerSigned && contract.signatures.ngoSigned) contract.status = 'Active';
    await contract.save();

    const recipient = signerRole === 'Farmer' ? contract.ngo.user : contract.farmer.user;
    if (recipient?.email) {
      await sendEmail({
        to: recipient.email,
        subject: `Contract ${contractId} Signed by ${signerRole}`,
        html: `<p>The contract <strong>${contractId}</strong> has been signed by ${signerRole}.</p>`
      });
    }

    res.json({ success: true, message: `Contract successfully signed by ${signerRole}.`, contract, signatureUrl });
  } catch (err) {
    next(err);
  }
};

// ✅ Updated Disburse Funds with private key validation
exports.disburseFunds = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { privateKey } = req.body;

    // Validate private key format
    if (!privateKey || typeof privateKey !== 'string' || !privateKey.startsWith('0x')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid private key format',
        error: 'Private key must be a hex string starting with 0x'
      });
    }

    const contract = await Contract.findOne({
      $or: [{ _id: id }, { contractId: id }]
    })
    .populate({
      path: 'farmer',
      populate: { path: 'user', select: 'email walletAddress' }
    })
    .populate({
      path: 'ngo',
      populate: { path: 'user', select: 'walletAddress' }
    });

    if (!contract) {
      return res.status(404).json({ success: false, message: 'Contract not found.' });
    }

    const ngo = await NGO.findOne({ user: req.user._id });
    if (!ngo || !contract.ngo.equals(ngo._id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized to disburse funds for this contract.' });
    }

    if (contract.status !== 'Active') {
      return res.status(400).json({ success: false, message: 'Only active contracts can disburse funds.' });
    }

    const { amount, farmer } = contract;
    const toAddress = farmer.user.walletAddress;
    const fromAddress = req.user.walletAddress;

    if (!toAddress || !fromAddress) {
      return res.status(400).json({ success: false, message: 'Missing wallet addresses for transaction.' });
    }

    const { txHash } = await sendTokens({ to: toAddress, amount, privateKey });

    await Transaction.create({
      from: fromAddress,
      to: toAddress,
      amount,
      txHash,
      contract: contract._id,
      timestamp: new Date()
    });

    contract.status = 'Completed';
    contract.disbursementDate = new Date();
    contract.disbursementTxHash = txHash;
    await contract.save();

    if (farmer.user.email) {
      await sendEmail({
        to: farmer.user.email,
        subject: 'Funds Disbursed',
        html: `
          <p>Funds for contract <strong>${contract.contractId}</strong> have been disbursed.</p>
          <p><strong>Amount:</strong> ${amount} ETH</p>
          <p><strong>Transaction Hash:</strong> ${txHash}</p>
          <p>View on <a href="https://etherscan.io/tx/${txHash}" target="_blank">Etherscan</a>.</p>
        `
      });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('contractUpdate', {
        contractId: contract._id,
        status: 'Completed',
        txHash
      });
    }

    res.json({
      success: true,
      message: 'Funds successfully disbursed.',
      txHash,
      contract
    });
  } catch (err) {
    console.error('Disbursement error:', err);
    res.status(500).json({
      success: false,
      message: 'Error disbursing funds',
      error: err.message
    });
  }
};

// Record Milestone
exports.recordMilestone = async (req, res, next) => {
  try {
    const { description } = req.body;
    const files = req.files || [];
    const contractId = req.params.id;

    if (!description) return res.status(400).json({ message: 'Description is required.' });

    const farmer = await Farmer.findOne({ user: req.user._id });
    if (!farmer) return res.status(404).json({ message: 'Farmer profile not found.' });

    const contract = await Contract.findById(contractId);
    if (!contract) return res.status(404).json({ message: 'Contract not found.' });
    if (!contract.farmer.equals(farmer._id)) return res.status(403).json({ message: 'Unauthorized to update this contract.' });

    const fileUrls = files.length > 0 ? await uploadMultipleToIPFS(files) : [];

    contract.milestones.push({ description, files: fileUrls, date: new Date() });
    await contract.save();

    const ngo = await NGO.findById(contract.ngo).populate('user', 'email');
    if (ngo?.user?.email) {
      await sendEmail({
        to: ngo.user.email,
        subject: `New Milestone for Contract ${contract.contractId}`,
        html: `<p>A new milestone has been recorded for contract ${contract.contractId}.</p>
               <p><strong>Description:</strong> ${description}</p>
               ${fileUrls.length > 0 ? `<p>Includes ${fileUrls.length} supporting files.</p>` : ''}`
      });
    }

    res.json({ message: 'Milestone successfully recorded.', contract });
  } catch (err) {
    next(err);
  }
};

// Mark Contract as Complete
exports.markComplete = async (req, res, next) => {
  try {
    const contractId = req.params.id;
    const ngo = await NGO.findOne({ user: req.user._id });
    if (!ngo) return res.status(404).json({ message: 'NGO profile not found.' });

    const contract = await Contract.findById(contractId);
    if (!contract) return res.status(404).json({ message: 'Contract not found.' });
    if (!contract.ngo.equals(ngo._id)) return res.status(403).json({ message: 'Unauthorized to update this contract.' });

    contract.status = 'Completed';
    await contract.save();

    const farmer = await Farmer.findById(contract.farmer).populate('user', 'email');
    if (farmer?.user?.email) {
      await sendEmail({
        to: farmer.user.email,
        subject: `Contract ${contract.contractId} Completed`,
        html: `<p>The contract ${contract.contractId} has been marked as completed by ${ngo.ngoName}.</p>
               <p>Thank you for your participation.</p>`
      });
    }

    res.json({ message: 'Contract successfully marked as complete.', contract });
  } catch (err) {
    next(err);
  }
};
