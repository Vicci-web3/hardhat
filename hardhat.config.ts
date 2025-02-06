import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import "@nomicfoundation/hardhat-verify";
import "hardhat-deploy";

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    base: {
      url: `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY}`,
        chainId: 8453,
      accounts: {
        mnemonic: process.env.MNEMONIC
      },
      saveDeployments: true
    },
    baseSepolia: {
      url: `https://base-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY}`,
      chainId: 84532,
      accounts: {
        mnemonic: process.env.MNEMONIC
      },
    }, 
  },
  etherscan: {
    apiKey: {
      baseSepolia: process.env.BASESCAN_API_KEY,
      base: process.env.BASESCAN_API_KEY,
    }
  }
};

export default config;
