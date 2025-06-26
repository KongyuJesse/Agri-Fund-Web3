import { ethers } from "ethers";
import FundingAgreementABI from "../../blockchain/artifacts/contracts/FundingAgreement.sol/FundingAgreement.json";

let provider;
let signer;
let contract;

export const initWeb3 = async () => {
  if (window.ethereum) {
    try {
      // Request account access
      await window.ethereum.request({ method: "eth_requestAccounts" });
      provider = new ethers.providers.Web3Provider(window.ethereum);
      signer = provider.getSigner();
      
      // Initialize contract
      contract = new ethers.Contract(
        process.env.REACT_APP_CONTRACT_ADDRESS,
        FundingAgreementABI.abi,
        signer
      );
      
      return true;
    } catch (error) {
      console.error("User denied account access", error);
      return false;
    }
  } else {
    console.log("MetaMask not detected");
    return false;
  }
};

export const getContract = () => contract;
export const getSigner = () => signer;
export const getProvider = () => provider;

export const getBalance = async (address) => {
  const balance = await provider.getBalance(address);
  return ethers.utils.formatEther(balance);
};