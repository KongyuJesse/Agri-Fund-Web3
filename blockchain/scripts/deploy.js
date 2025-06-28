const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const FundingAgreement = await ethers.getContractFactory("FundingAgreement");
  const fundingAgreement = await FundingAgreement.deploy();

  await fundingAgreement.waitForDeployment();

  console.log("FundingAgreement deployed to:", await fundingAgreement.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
