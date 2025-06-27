const Web3 = require('web3').default;
const FundingAgreementABI = require('../contracts/abi/FundingAgreement.json').abi;
const config = require('../config');

const web3 = new Web3(config.blockchain.rpcUrl);

const fundingAgreement = new web3.eth.Contract(
  FundingAgreementABI,
  config.blockchain.contractAddress
);

// Enhanced sendTokens with gas estimation and validation
exports.sendTokens = async ({ to, amount, privateKey }) => {
  try {
    if (!privateKey || typeof privateKey !== 'string' || !/^0x[a-fA-F0-9]{64}$/.test(privateKey.trim())) {
      throw new Error('Invalid Private Key: Must be a 64-character hex string with 0x prefix');
    }

    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    if (!account) throw new Error('Failed to create account from private key');

    const valueInWei = web3.utils.toWei(amount.toString(), 'ether');

    const gas = await web3.eth.estimateGas({
      from: account.address,
      to,
      value: valueInWei
    });

    const gasPrice = await web3.eth.getGasPrice();

    const tx = {
      from: account.address,
      to,
      value: valueInWei,
      gas,
      gasPrice
    };

    const signedTx = await account.signTransaction(tx);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    return { txHash: receipt.transactionHash };
  } catch (err) {
    console.error('Error sending tokens:', err);
    throw new Error(`Transaction failed: ${err.message}`);
  }
};

exports.createFundingAgreement = async ({ ngoAddress, farmerAddress, amount, ipfsHash, privateKey }) => {
  try {
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);

    const tx = fundingAgreement.methods.createFundingAgreement(
      farmerAddress,
      web3.utils.toWei(amount.toString(), 'ether'),
      ipfsHash
    );

    const gas = await tx.estimateGas({ from: account.address });
    const gasPrice = await web3.eth.getGasPrice();
    const data = tx.encodeABI();

    const signedTx = await account.signTransaction({
      to: config.blockchain.contractAddress,
      data,
      gas,
      gasPrice
    });

    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    const event = receipt.events?.AgreementCreated;
    if (!event) throw new Error('AgreementCreated event not found in transaction receipt');

    const agreementId = event.returnValues.agreementId;
    return { txHash: receipt.transactionHash, agreementId };
  } catch (err) {
    console.error('Error creating funding agreement:', err);
    throw err;
  }
};

exports.signAgreement = async ({ agreementId, privateKey }) => {
  try {
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    const tx = fundingAgreement.methods.signAgreement(agreementId);

    const gas = await tx.estimateGas({ from: account.address });
    const gasPrice = await web3.eth.getGasPrice();
    const data = tx.encodeABI();

    const signedTx = await account.signTransaction({
      to: config.blockchain.contractAddress,
      data,
      gas,
      gasPrice
    });

    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    return { txHash: receipt.transactionHash };
  } catch (err) {
    console.error('Error signing agreement:', err);
    throw err;
  }
};

exports.disburseFunds = async ({ agreementId, amount, privateKey }) => {
  try {
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    const value = web3.utils.toWei(amount.toString(), 'ether');

    const tx = fundingAgreement.methods.disburseFunds(agreementId);

    const gas = await tx.estimateGas({
      from: account.address,
      value
    });

    const gasPrice = await web3.eth.getGasPrice();
    const data = tx.encodeABI();

    const signedTx = await account.signTransaction({
      to: config.blockchain.contractAddress,
      data,
      gas,
      gasPrice,
      value
    });

    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    return { txHash: receipt.transactionHash };
  } catch (err) {
    console.error('Error disbursing funds:', err);
    throw err;
  }
};

exports.recordMilestone = async ({ agreementId, ipfsHash, privateKey }) => {
  try {
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    const tx = fundingAgreement.methods.recordMilestone(agreementId, ipfsHash);

    const gas = await tx.estimateGas({ from: account.address });
    const gasPrice = await web3.eth.getGasPrice();
    const data = tx.encodeABI();

    const signedTx = await account.signTransaction({
      to: config.blockchain.contractAddress,
      data,
      gas,
      gasPrice
    });

    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    return { txHash: receipt.transactionHash };
  } catch (err) {
    console.error('Error recording milestone:', err);
    throw err;
  }
};

exports.markComplete = async ({ agreementId, privateKey }) => {
  try {
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    const tx = fundingAgreement.methods.markComplete(agreementId);

    const gas = await tx.estimateGas({ from: account.address });
    const gasPrice = await web3.eth.getGasPrice();
    const data = tx.encodeABI();

    const signedTx = await account.signTransaction({
      to: config.blockchain.contractAddress,
      data,
      gas,
      gasPrice
    });

    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    return { txHash: receipt.transactionHash };
  } catch (err) {
    console.error('Error marking agreement complete:', err);
    throw err;
  }
};

exports.getAgreement = async (agreementId) => {
  try {
    return await fundingAgreement.methods.getAgreement(agreementId).call();
  } catch (err) {
    console.error('Error getting agreement:', err);
    throw err;
  }
};

exports.getBalance = async (address) => {
  try {
    const balance = await web3.eth.getBalance(address);
    return web3.utils.fromWei(balance, 'ether');
  } catch (err) {
    console.error('Error getting balance:', err);
    throw err;
  }
};
