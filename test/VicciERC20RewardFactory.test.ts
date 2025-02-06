import { network, viem } from 'hardhat'
import hre from 'hardhat'
import { expect } from "chai";
import "@nomicfoundation/hardhat-chai-matchers";

import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";

import deploy from '../deploy/001_VicciRewardERC20'

import { createPublicClient, custom, JsonRpcVersionUnsupportedError } from "viem";
import { type PublicClient } from 'viem'
describe("VicciERC20RewardFactory", () => {
    let mockERC20Address: `0x${string}`;
    let vicciRewardERC20FactoryAddress: `0x${string}`;
    let rewardContract: any;
    let deployer: any;
    let agent: any;
    let venue: any;
    let visitor: any;
    let mockERC20Domain: any;
    let publicClient: PublicClient;

    let rewardContractAddress: `0x${string}`;

    before(async () => {
        ;([deployer, agent, venue, visitor] = await viem.getWalletClients())
        publicClient = await viem.getPublicClient()

        ;({ mockERC20Address, vicciRewardERC20FactoryAddress } = await deploy(hre))

        const mockERC20 = await viem.getContractAt(
            "MockERC20",
            mockERC20Address,
            {
                client: {
                    wallet: deployer,
                    public: publicClient
                }
            }
        )
        mockERC20Domain = await mockERC20.read.eip712Domain()
        console.log('mockERC20Domain', mockERC20Domain)
        
        const faucetHash = await mockERC20.write.faucet([venue.account.address, 1000])
        const tx = await publicClient.waitForTransactionReceipt({ hash: faucetHash })
    })

    it("should deploy a reward contract", async () => {
        const mockERC20 = await viem.getContractAt(
            "MockERC20",
            mockERC20Address,
            {
                client: {
                    wallet: venue,
                    public: publicClient
                }
            }
        )
        const deadline = Math.floor(Date.now() / 1000) + 60
        const venueSignature = await venue.signTypedData({
            domain: {
                name: "MockERC20",
                version: "1",
                chainId: await publicClient.getChainId(),
                verifyingContract: mockERC20Address
            },
            types: {
                Permit: [
                    { name: "owner", type: "address" },
                    { name: "spender", type: "address" },
                    { name: "value", type: "uint256" },
                    { name: "nonce", type: "uint256" },
                    { name: "deadline", type: "uint256" },
                ]
            },
            primaryType: "Permit",
            message: {
                owner: venue.account.address,
                spender: vicciRewardERC20FactoryAddress,
                value: 1000,
                nonce: await mockERC20.read.nonces([venue.account.address]),
                deadline: deadline,
            }
        })
        console.log('venueSignature', venueSignature)
        const signatureSans0x = venueSignature.substring(2)
        const r = '0x' + signatureSans0x.substring(0,64)
        const s = '0x' + signatureSans0x.substring(64,128)
        const v = parseInt(signatureSans0x.substring(128,130), 16)
        console.log('v: ', v)
        console.log('r: ', r) 
        console.log('s: ', s)

        const rewardContract = await viem.getContractAt(
            "VicciRewardERC20Factory",
            vicciRewardERC20FactoryAddress,
            {
                client: {
                    wallet: agent,
                    public: publicClient
                }
            }
        )
        const hash = await rewardContract.write.deployRewardContract([
            mockERC20Address,
            "test-campaign",
            agent.account.address,
            venue.account.address,
            1000,
            deadline,
            v,
            r,
            s
        ])
        const tx = await publicClient.waitForTransactionReceipt({ hash  })
        const rewardContractDeployedEvents = await rewardContract.getEvents.RewardContractDeployed()
        rewardContractAddress = rewardContractDeployedEvents[0].args.rewardContract
    })

    it("the agent can create a permit for a visitor to claim a reward", async () => {
        /* Agent writes the permit */
        const deadline = Math.floor(Date.now() / 1000) + 60
        const rewardContractVisitor = await viem.getContractAt(
            "VicciRewardERC20",
            rewardContractAddress,
            {
                client: {
                    wallet: visitor,
                    public: publicClient
                }
            }
        )
        const nonce = await rewardContractVisitor.read.nonces([visitor.account.address])
        const agentsPermitSignature = await agent.signTypedData({
            domain: {
                name: "VicciReward",
                version: "4",
                chainId: await publicClient.getChainId(),
                verifyingContract: rewardContractAddress
            },
            types: {
                RewardClaim: [
                    { name: "user", type: "address" },
                    { name: "amount", type: "uint256" },
                    { name: "deadline", type: "uint256" },
                    { name: "nonce", type: "uint256" }
                ]
            },
            primaryType: "RewardClaim",
            message: {
                user: visitor.account.address,
                amount: 1000,
                deadline,
                nonce
            }
        })
        
        const hash = await rewardContractVisitor.write.claimReward([
            {
                user: visitor.account.address,
                amount: 1000,
                deadline,
                nonce
            },
            agentsPermitSignature
        ])
        const tx = await publicClient.waitForTransactionReceipt({ hash  })
    })
        
})