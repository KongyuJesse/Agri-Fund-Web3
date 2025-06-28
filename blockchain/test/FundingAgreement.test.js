const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FundingAgreement", function () {
  let FundingAgreement;
  let fundingAgreement;
  let owner;
  let ngo;
  let farmer;

  beforeEach(async function () {
    [owner, ngo, farmer] = await ethers.getSigners();

    FundingAgreement = await ethers.getContractFactory("FundingAgreement");
    fundingAgreement = await FundingAgreement.deploy();
    await fundingAgreement.waitForDeployment(); // Ethers v6 syntax
  });

  it("Should create a new funding agreement", async function () {
    const amount = ethers.parseEther("1.0");
    const ipfsHash = "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";

    const tx = await fundingAgreement.connect(ngo).createFundingAgreement(
      farmer.address,
      amount,
      ipfsHash
    );

    const receipt = await tx.wait();
    const event = receipt.logs.find(log =>
      log.fragment?.name === "AgreementCreated"
    );
    const agreementId = event.args.agreementId;

    const agreement = await fundingAgreement.getAgreement(agreementId);

    expect(agreement.ngo).to.equal(ngo.address);
    expect(agreement.farmer).to.equal(farmer.address);
    expect(agreement.amount).to.equal(amount);
    expect(agreement.ipfsHash).to.equal(ipfsHash);
    expect(agreement.status).to.equal(0); // Created
  });

  // Add more tests as needed
});
