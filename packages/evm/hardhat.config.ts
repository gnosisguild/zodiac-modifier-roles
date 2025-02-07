import dotenv from "dotenv";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";

import "hardhat-contract-sizer";
import "hardhat-gas-reporter";
import { HardhatUserConfig } from "hardhat/config";
import type { HttpNetworkUserConfig } from "hardhat/types";
import "solidity-coverage";

import { TypechainConfig } from "@typechain/hardhat/dist/types";

// Load environment variables.
dotenv.config();

import "./tasks/deploy-mastercopies";
import "./tasks/deploy-mastercopy";
import "./tasks/extract-mastercopy";
import "./tasks/verify-mastercopies";
import "./tasks/verify-mastercopy";

const {
  INFURA_KEY,
  PK,
  MNEMONIC,
  ETHERSCAN_API_KEY,
  OPTIMISTIC_ETHERSCAN_API_KEY,
  GNOSISSCAN_API_KEY,
  POLYGONSCAN_API_KEY,
  ARBISCAN_API_KEY,
  SNOWTRACE_API_KEY,
  ZKEVM_POLYGONSCAN_API_KEY,
  BASESCAN_API_KEY,
  BSCSCAN_API_KEY,
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
    optimism: {
      ...sharedNetworkConfig,
      chainId: 10,
      url: "https://mainnet.optimism.io",
    },
    gnosis: {
      ...sharedNetworkConfig,
      chainId: 100,
      url: "https://rpc.gnosischain.com",
    },
    base: {
      ...sharedNetworkConfig,
      chainId: 8453,
      url: "https://mainnet.base.org",
    },
    matic: {
      ...sharedNetworkConfig,
      chainId: 137,
      url: "https://rpc-mainnet.maticvigil.com",
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
    zkevm: {
      ...sharedNetworkConfig,
      chainId: 1101,
      url: "https://zkevm-rpc.com",
    },
    bsc: {
      ...sharedNetworkConfig,
      chainId: 56,
      url: "https://bscrpc.com",
    },
    sepolia: {
      ...sharedNetworkConfig,
      chainId: 11155111,
      url: `https://sepolia.infura.io/v3/${INFURA_KEY}`,
    },
    baseSepolia: {
      ...sharedNetworkConfig,
      chainId: 84532,
      url: `https://sepolia.base.org`,
    },
    "lisk-sepolia": {
      ...sharedNetworkConfig,
      chainId: 4202,
      url: "https://rpc.sepolia-api.lisk.com",
      gasPrice: 1000000000,
    },
  },
  etherscan: {
    apiKey: {
      mainnet: ETHERSCAN_API_KEY,
      sepolia: ETHERSCAN_API_KEY,
      optimism: OPTIMISTIC_ETHERSCAN_API_KEY,
      gnosis: GNOSISSCAN_API_KEY,
      matic: POLYGONSCAN_API_KEY,
      arbitrum: ARBISCAN_API_KEY,
      avalanche: SNOWTRACE_API_KEY,
      zkevm: ZKEVM_POLYGONSCAN_API_KEY,
      base: BASESCAN_API_KEY,
      baseSepolia: BASESCAN_API_KEY,
      bsc: BSCSCAN_API_KEY,
      // Use "ETHERSCAN_API_KEY" as a placeholder, because Blockscout doesn't need a real API key, and Hardhat will complain if this property isn't set.
      "lisk-sepolia": ETHERSCAN_API_KEY,
    } as Record<string, string>,
    customChains: [
      {
        network: "optimism",
        chainId: 10,
        urls: {
          apiURL: "https://api-optimistic.etherscan.io/api",
          browserURL: "https://optimistic.etherscan.io",
        },
      },
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
      {
        network: "zkevm",
        chainId: 1101,
        urls: {
          apiURL: "https://api-zkevm.polygonscan.com/api",
          browserURL: "https://zkevm.polygonscan.com",
        },
      },
      {
        network: "bsc",
        chainId: 56,
        urls: {
          apiURL: "https://api.bscscan.com/api",
          browserURL: "https://bscscan.com",
        },
      },
      {
        network: "lisk-sepolia",
        chainId: 4202,
        urls: {
          apiURL: "https://sepolia-blockscout.lisk.com/api",
          browserURL: "https://sepolia-blockscout.lisk.com",
        },
      },
    ],
  },
  sourcify: {
    enabled: false,
  },
  gasReporter: {
    enabled: true,
  },
  typechain: {
    target: require.resolve("@gnosis-guild/typechain-ethers-v6"),
  } satisfies Partial<TypechainConfig>,
};

export default config;
