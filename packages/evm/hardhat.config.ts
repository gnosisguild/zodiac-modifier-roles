import dotenv from "dotenv";
import "@nomicfoundation/hardhat-toolbox";

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

const { INFURA_KEY, PK, MNEMONIC, ETHERSCAN_API_KEY } = process.env;

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
        version: "0.8.28",
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
    sepolia: {
      ...sharedNetworkConfig,
      chainId: 11155111,
      url: `https://sepolia.infura.io/v3/${INFURA_KEY}`,
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
    baseSepolia: {
      ...sharedNetworkConfig,
      chainId: 84532,
      url: "https://sepolia.base.org",
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
    celo: {
      ...sharedNetworkConfig,
      chainId: 42220,
      url: "https://celo.drpc.org",
    },
    lisk: {
      ...sharedNetworkConfig,
      chainId: 1135,
      url: "https://rpc.api.lisk.com",
    },
    "lisk-sepolia": {
      ...sharedNetworkConfig,
      chainId: 4202,
      url: "https://rpc.sepolia-api.lisk.com",
      gasPrice: 1000000000,
    },
    liskSepolia: {
      ...sharedNetworkConfig,
      chainId: 4202,
      url: "https://rpc.sepolia-api.lisk.com",
    },
    "bob-sepolia": {
      ...sharedNetworkConfig,
      chainId: 808813,
      url: "https://bob-sepolia.rpc.gobob.xyz/",
      gasPrice: 1000000000,
    },
    unichain: {
      ...sharedNetworkConfig,
      chainId: 130,
      url: "https://mainnet.unichain.org",
    },
    mantle: {
      ...sharedNetworkConfig,
      chainId: 5000,
      url: "https://rpc.mantle.xyz",
    },
    sonic: {
      ...sharedNetworkConfig,
      chainId: 146,
      url: "https://rpc.soniclabs.com",
    },
    berachain: {
      ...sharedNetworkConfig,
      chainId: 80094,
      url: "https://rpc.berachain.com",
    },
    hyperevm: {
      ...sharedNetworkConfig,
      chainId: 999,
      url: "https://rpc.hyperliquid.xyz/evm",
    },
    worldchain: {
      ...sharedNetworkConfig,
      chainId: 480,
      url: "https://worldchain-mainnet.g.alchemy.com/public",
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
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
        network: "celo",
        chainId: 42220,
        urls: {
          apiURL: "https://api.celoscan.io/api",
          browserURL: "https://celoscan.io",
        },
      },
      {
        network: "mantle",
        chainId: 5000,
        urls: {
          apiURL: "https://api.mantlescan.xyz/api",
          browserURL: "https://mantlescan.xyz",
        },
      },
      {
        network: "unichain",
        chainId: 130,
        urls: {
          apiURL: "https://api.uniscan.xyz/api",
          browserURL: "https://uniscan.xyz",
        },
      },
      {
        network: "sonic",
        chainId: 146,
        urls: {
          apiURL: "https://api.sonicscan.org/api",
          browserURL: "https://sonicscan.org",
        },
      },
      {
        network: "berachain",
        chainId: 80094,
        urls: {
          apiURL: "https://api.berascan.com/api",
          browserURL: "https://berascan.com",
        },
      },
      {
        network: "hyperevm",
        chainId: 999,
        urls: {
          apiURL: "https://www.hyperscan.com/api",
          browserURL: "https://www.hyperscan.com",
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
      {
        network: "bob-sepolia",
        chainId: 808813,
        urls: {
          apiURL: "https://bob-sepolia.explorer.gobob.xyz/api",
          browserURL: "https://bob-sepolia.explorer.gobob.xyz",
        },
      },
      {
        network: "worldchain",
        chainId: 480,
        urls: {
          apiURL: "https://api.worldscan.org/api",
          browserURL: "https://worldscan.org",
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
