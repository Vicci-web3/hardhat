pragma solidity ^0.8.28;

import "./MockERC20.sol";

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "hardhat/console.sol";
struct RewardClaim {
    address user;
    uint256 amount;
    uint256 deadline;
    uint256 nonce;
}


contract VicciRewardERC20 is EIP712 {
    MockERC20 public rewardToken;
    uint256 public rewardPool;

    string public campaignId;
    address public agent;

    mapping(address => uint256) public nonces;

    bytes32 public immutable REWARD_CLAIM_TYPEHASH = keccak256("RewardClaim(address user,uint256 amount,uint256 deadline,uint256 nonce)");

    event RewardClaimed(address indexed user, uint256 amount, uint256 deadline, uint256 nonce);
    constructor(
        address _rewardToken,
        string memory _campaignId,
        address _agent
        ) EIP712("VicciReward", "4") {
        rewardToken = MockERC20(_rewardToken);

        campaignId = _campaignId;
        agent = _agent; // hopefully msg.sender from coinbase agentkit
    }

    function claimReward(
        RewardClaim memory claim,
        bytes memory signature
    ) public {
        bytes32 hashStruct = keccak256(
            abi.encode(
                REWARD_CLAIM_TYPEHASH,
                claim.user,
                claim.amount,
                claim.deadline,
                claim.nonce
            )
        );
        bytes32 digest = _hashTypedDataV4(hashStruct);
        //if agents are robots with EOAs
        //address signer = ECDSA.recover(digest, signature);
        //require(signer == agent, "only the agent may authorize rewards claims");
        // if agents are smart contracts
        bool isValid = SignatureChecker.isValidSignatureNow(
            agent,
            digest,
            signature
        );
        require(isValid, "only the agent may authorize rewards claims");

        // replay protection incremented nonces
        if (nonces[claim.user] == claim.nonce) {
            nonces[claim.user]++;
            rewardToken.transfer(claim.user, claim.amount);
            emit RewardClaimed(claim.user, claim.amount, claim.deadline, claim.nonce);
        } else {
            revert("invalid nonce");
        }
    }
}

contract VicciRewardERC20Factory {

    event RewardContractDeployed(
        address indexed rewardContract,
        address indexed rewardToken,
        string campaignId,
        address agent
    );

    constructor() {}

    function deployRewardContract(
        address rewardToken,
        string memory campaignId,
        address agent,
        address venue,
        uint256 initialRewardPool,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external returns (address) {
        console.log("deploying reward contract");
        VicciRewardERC20 rewardContract = new VicciRewardERC20(
            rewardToken,
            campaignId,
            agent
        );
        console.log("reward contract deployed");
        MockERC20(rewardToken).permit(
            venue,
            address(this),
            initialRewardPool,
            deadline,
            v,
            r,
            s
        );
        console.log("permit called");
        MockERC20(rewardToken).transferFrom(venue, address(rewardContract), initialRewardPool);
        
        emit RewardContractDeployed(
            address(rewardContract),
            rewardToken,
            campaignId,
            agent
        );
        
        return address(rewardContract);
    }
}
