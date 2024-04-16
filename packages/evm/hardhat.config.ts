import dotenv from "dotenv";
import "@nomicfoundation/hardhat-toolbox";

import "hardhat-contract-sizer";
import "hardhat-gas-reporter";

import { HardhatUserConfig } from "hardhat/config";
import type { HttpNetworkUserConfig } from "hardhat/types";

import "./tasks/deploy-adapters";
import "./tasks/deploy-mastercopy";
import "./tasks/deploy-proxy";
import "./tasks/deploy-standalone";

// Load environment variables.
dotenv.config();
const {
  INFURA_KEY,
  PK,
  MNEMONIC,
  ETHERSCAN_API_KEY,
  GNOSISSCAN_API_KEY,
  POLYGONSCAN_API_KEY,
  ARBISCAN_API_KEY,
  SNOWTRACE_API_KEY,
} = process.env;

const sharedNetworkConfig: HttpNetworkUserConfig = {};
if (PK) {
  sharedNetworkConfig.accounts = [PK];
} else {
  sharedNetworkConfig.accounts = {
    mnemonic:
      MNEMONIC ||
      "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat",
  };
}

const config: HardhatUserConfig = {
  paths: {
    artifacts: "build/artifacts",
    cache: "build/cache",
    sources: "contracts",
  },
  solidity: {
    compilers: [
      {
        version: "0.8.21",
        settings: {
          evmVersion: "shanghai",
          optimizer: {
            enabled: true,
            runs: 100,
          },
        },
      },
    ],
  },
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
    },
    mainnet: {
      ...sharedNetworkConfig,
      chainId: 1,
      url: `https://mainnet.infura.io/v3/${INFURA_KEY}`,
    },
    gnosis: {
      ...sharedNetworkConfig,
      chainId: 100,
      url: "https://rpc.gnosischain.com",
    },
    sepolia: {
      ...sharedNetworkConfig,
      chainId: 11155111,
      url: `https://sepolia.infura.io/v3/${INFURA_KEY}`,
    },
    matic: {
      ...sharedNetworkConfig,
      chainId: 137,
      url: "https://rpc-mainnet.maticvigil.com",
    },
    mumbai: {
      ...sharedNetworkConfig,
      chainId: 80001,
      url: "https://rpc.ankr.com/polygon_mumbai",
    },
    arbitrum: {
      ...sharedNetworkConfig,
      chainId: 42161,
      url: "https://arb1.arbitrum.io/rpc",
    },
    avalanche: {
      ...sharedNetworkConfig,
      chainId: 43114,
      url: "https://rpc.ankr.com/avalanche",
    },
  },
  etherscan: {
    apiKey: {
      mainnet: ETHERSCAN_API_KEY,
      sepolia: ETHERSCAN_API_KEY,
      gnosis: GNOSISSCAN_API_KEY,
      matic: POLYGONSCAN_API_KEY,
      mumbai: POLYGONSCAN_API_KEY,
      arbitrum: ARBISCAN_API_KEY,
      avalanche: SNOWTRACE_API_KEY,
    } as Record<string, string>,
    customChains: [
      {
        network: "gnosis",
        chainId: 100,
        urls: {
          apiURL: "https://api.gnosisscan.io/api",
          browserURL: "https://www.gnosisscan.io",
        },
      },
      {
        network: "matic",
        chainId: 137,
        urls: {
          apiURL: "https://api.polygonscan.com/api",
          browserURL: "https://www.polygonscan.com",
        },
      },
      {
        network: "mumbai",
        chainId: 80001,
        urls: {
          apiURL: "https://api-testnet.polygonscan.com/api",
          browserURL: "https://mumbai.polygonscan.com",
        },
      },
      {
        network: "arbitrum",
        chainId: 42161,
        urls: {
          apiURL: "https://api.arbiscan.io/api",
          browserURL: "https://www.arbiscan.io",
        },
      },
      {
        network: "avalanche",
        chainId: 43114,
        urls: {
          apiURL: "https://api.snowtrace.io/api",
          browserURL: "https://www.snowtrace.io",
        },
      },
    ],
  },
  gasReporter: {
    enabled: true,
  },
};

export default config;
