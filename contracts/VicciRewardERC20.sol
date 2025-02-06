pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

struct RewardClaim {
    address user;
    uint256 amount;
    uint256 timestamp;
    uint256 nonce;
}


contract VicciReward is EIP712 {
    IERC20 public rewardToken;
    uint256 public rewardPool;

    string public campaignId;
    address public agent;

    mapping(address => uint256) public nonces;

    bytes32 public immutable REWARD_CLAIM_TYPEHASH = keccak256("RewardClaim(address user,uint256 amount,uint256 timestamp,uint256 nonce)");

    event RewardClaimed(address indexed user, uint256 amount, uint256 timestamp, uint256 nonce);
    constructor(
        address _rewardToken,
        string memory _campaignId,
        address _agent
        ) EIP712("VicciReward", "4") {
        rewardToken = IERC20(_rewardToken);
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
                claim.timestamp,
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
            rewardToken.transferFrom(agent, claim.user, claim.amount);
            emit RewardClaimed(claim.user, claim.amount, claim.timestamp, claim.nonce);
        } else {
            revert("invalid nonce");
        }
    }
    
}