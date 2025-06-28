// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract FundingAgreement {
    enum AgreementStatus { Created, Signed, Active, Completed }
    
    struct Agreement {
        address ngo;
        address farmer;
        uint amount;
        string ipfsHash;
        AgreementStatus status;
        bool ngoSigned;
        bool farmerSigned;
        uint createdAt;
        uint updatedAt;
    }
    
    mapping(bytes32 => Agreement) public agreements;
    bytes32[] public agreementIds;
    
    event AgreementCreated(bytes32 indexed agreementId, address indexed ngo, address indexed farmer, uint amount, string ipfsHash);
    event AgreementSigned(bytes32 indexed agreementId, address indexed signer);
    event FundsDisbursed(bytes32 indexed agreementId, address indexed to, uint amount);
    event MilestoneReported(bytes32 indexed agreementId, string ipfsHash);
    event AgreementCompleted(bytes32 indexed agreementId);
    
    function createFundingAgreement(
        address _farmer,
        uint _amount,
        string memory _ipfsHash
    ) external returns (bytes32) {
        require(_farmer != address(0), "Invalid farmer address");
        require(_amount > 0, "Amount must be greater than 0");
        require(bytes(_ipfsHash).length > 0, "IPFS hash is required");
        
        bytes32 agreementId = keccak256(abi.encodePacked(
            msg.sender,
            _farmer,
            _amount,
            _ipfsHash,
            block.timestamp
        ));
        
        agreements[agreementId] = Agreement({
            ngo: msg.sender,
            farmer: _farmer,
            amount: _amount,
            ipfsHash: _ipfsHash,
            status: AgreementStatus.Created,
            ngoSigned: false,
            farmerSigned: false,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });
        
        agreementIds.push(agreementId);
        
        emit AgreementCreated(agreementId, msg.sender, _farmer, _amount, _ipfsHash);
        
        return agreementId;
    }
    
    function signAgreement(bytes32 _agreementId) external {
        Agreement storage agreement = agreements[_agreementId];
        require(agreement.ngo != address(0), "Agreement not found");
        
        if (msg.sender == agreement.ngo) {
            agreement.ngoSigned = true;
        } else if (msg.sender == agreement.farmer) {
            agreement.farmerSigned = true;
        } else {
            revert("Not authorized to sign");
        }
        
        if (agreement.ngoSigned && agreement.farmerSigned) {
            agreement.status = AgreementStatus.Active;
        } else {
            agreement.status = AgreementStatus.Signed;
        }
        
        agreement.updatedAt = block.timestamp;
        
        emit AgreementSigned(_agreementId, msg.sender);
    }
    
    function disburseFunds(bytes32 _agreementId) external payable {
        Agreement storage agreement = agreements[_agreementId];
        require(agreement.ngo != address(0), "Agreement not found");
        require(msg.sender == agreement.ngo, "Only NGO can disburse funds");
        require(agreement.status == AgreementStatus.Active, "Agreement not active");
        require(msg.value >= agreement.amount, "Insufficient funds sent");
        
        (bool success, ) = agreement.farmer.call{value: agreement.amount}("");
        require(success, "Transfer failed");
        
        emit FundsDisbursed(_agreementId, agreement.farmer, agreement.amount);
    }
    
    function recordMilestone(bytes32 _agreementId, string memory _ipfsHash) external {
        Agreement storage agreement = agreements[_agreementId];
        require(agreement.ngo != address(0), "Agreement not found");
        require(msg.sender == agreement.farmer, "Only farmer can report milestones");
        require(agreement.status == AgreementStatus.Active, "Agreement not active");
        require(bytes(_ipfsHash).length > 0, "IPFS hash is required");
        
        emit MilestoneReported(_agreementId, _ipfsHash);
    }
    
    function markComplete(bytes32 _agreementId) external {
        Agreement storage agreement = agreements[_agreementId];
        require(agreement.ngo != address(0), "Agreement not found");
        require(msg.sender == agreement.ngo, "Only NGO can mark complete");
        require(agreement.status == AgreementStatus.Active, "Agreement not active");
        
        agreement.status = AgreementStatus.Completed;
        agreement.updatedAt = block.timestamp;
        
        emit AgreementCompleted(_agreementId);
    }
    
    function getAgreement(bytes32 _agreementId) external view returns (
        address ngo,
        address farmer,
        uint amount,
        string memory ipfsHash,
        AgreementStatus status,
        bool ngoSigned,
        bool farmerSigned,
        uint createdAt,
        uint updatedAt
    ) {
        Agreement storage agreement = agreements[_agreementId];
        require(agreement.ngo != address(0), "Agreement not found");
        
        return (
            agreement.ngo,
            agreement.farmer,
            agreement.amount,
            agreement.ipfsHash,
            agreement.status,
            agreement.ngoSigned,
            agreement.farmerSigned,
            agreement.createdAt,
            agreement.updatedAt
        );
    }
    
    function getAllAgreementIds() external view returns (bytes32[] memory) {
        return agreementIds;
    }
}
