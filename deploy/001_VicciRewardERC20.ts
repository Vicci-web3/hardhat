import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { PublicClient } from 'viem'
export default async function ({network, viem}: {network: string, viem: any}) {

    const [deployer] = await viem.getWalletClients()
    const publicClient: PublicClient = await viem.getPublicClient()
    const chainId = await publicClient.getChainId()
    console.log("Chain ID: ", chainId)

    const MockERC20 = await viem.deployContract(
        "MockERC20",
        [],
        {
            client: {
                wallet: deployer,
                public: publicClient
            }
        }
    )

    console.log("MockERC20 deployed to: ", MockERC20.address)

    const VicciRewardERC20Factory = await viem.deployContract(
        "VicciRewardERC20Factory",
        [],
        {
            client: {
                wallet: deployer,
                public: publicClient
            }
        }
    )

    console.log("VicciRewardERC20Factory deployed to: ", VicciRewardERC20Factory.address)

    // Write MockERC20 contract info
    const mockERC20Info = {
        addresses: {
            [chainId]: MockERC20.address
        },
        abi: MockERC20.abi
    }

    writeFileSync(
        join(__dirname, '../../MockERC20.json'),
        JSON.stringify(mockERC20Info, null, 2)
    )

    // Write VicciRewardERC20Factory contract info  
    const factoryInfo = {
        addresses: {
            [chainId]: VicciRewardERC20Factory.address
        },
        abi: VicciRewardERC20Factory.abi
    }

    writeFileSync(
        join(__dirname, '../../VicciRewardERC20Factory.json'),
        JSON.stringify(factoryInfo, null, 2)
    )

    return {
        mockERC20Address: MockERC20.address,
        vicciRewardERC20FactoryAddress: VicciRewardERC20Factory.address
    }

}