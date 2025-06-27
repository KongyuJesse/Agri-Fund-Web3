const { ethers } = require("ethers");
const FundingAgreementABI = require("../../blockchain/artifacts/contracts/FundingAgreement.sol/FundingAgreement.json").abi;
const config = require("../config");

const provider = new ethers.providers.JsonRpcProvider(config.blockchain.rpcUrl);
const fundingAgreement = new ethers.Contract(
  config.blockchain.contractAddress,
  FundingAgreementABI,
  provider
);

module.exports = {
  createFundingAgreement: async (ngoAddress, farmerAddress, amount, ipfsHash, privateKey) => {
    const wallet = new ethers.Wallet(privateKey, provider);
    const contractWithSigner = fundingAgreement.connect(wallet);
    
    const tx = await contractWithSigner.createFundingAgreement(
      farmerAddress,
      ethers.utils.parseEther(amount.toString()),
      ipfsHash
    );
    
    const receipt = await tx.wait();
    return receipt;
  },

  signAgreement: async (agreementId, privateKey) => {
    const wallet = new ethers.Wallet(privateKey, provider);
    const contractWithSigner = fundingAgreement.connect(wallet);
    
    const tx = await contractWithSigner.signAgreement(agreementId);
    return await tx.wait();
  },

  disburseFunds: async (agreementId, amount, privateKey) => {
    const wallet = new ethers.Wallet(privateKey, provider);
    const contractWithSigner = fundingAgreement.connect(wallet);
    
    const tx = await contractWithSigner.disburseFunds(agreementId, {
      value: ethers.utils.parseEther(amount.toString())
    });
    return await tx.wait();
  },

  getAgreement: async (agreementId) => {
    return await fundingAgreement.getAgreement(agreementId);
  },

  getBalance: async (address) => {
    const balance = await provider.getBalance(address);
    return ethers.utils.formatEther(balance);
  }
};