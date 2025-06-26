import React, { useState } from "react";
import { ethers } from "ethers";
import { getContract } from "../utils/web3";

export default function CreateContract() {
  const [farmerAddress, setFarmerAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [ipfsHash, setIpfsHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const contract = getContract();
      const tx = await contract.createFundingAgreement(
        farmerAddress,
        ethers.utils.parseEther(amount),
        ipfsHash
      );
      await tx.wait();
      setTxHash(tx.hash);
    } catch (error) {
      console.error("Error creating funding agreement:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-md rounded-md">
      <h2 className="text-xl font-semibold mb-4">Create Funding Agreement</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={farmerAddress}
          onChange={(e) => setFarmerAddress(e.target.value)}
          placeholder="Farmer Address"
          className="w-full border p-2 rounded"
          required
        />
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount (ETH)"
          step="0.01"
          className="w-full border p-2 rounded"
          required
        />
        <input
          type="text"
          value={ipfsHash}
          onChange={(e) => setIpfsHash(e.target.value)}
          placeholder="IPFS Hash"
          className="w-full border p-2 rounded"
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Agreement"}
        </button>
      </form>

      {txHash && (
        <div className="mt-4">
          <p className="text-sm font-medium">Transaction Hash:</p>
          <a
            href={`https://sepolia.etherscan.io/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline break-all"
          >
            {txHash}
          </a>
        </div>
      )}
    </div>
  );
}
