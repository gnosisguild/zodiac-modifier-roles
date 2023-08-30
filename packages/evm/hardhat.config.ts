import "@nomicfoundation/hardhat-toolbox";

import "hardhat-contract-sizer";
import "hardhat-gas-reporter";

import dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import type { HttpNetworkUserConfig } from "hardhat/types";
import yargs from "yargs";

import "./src/deploy";

const argv = yargs
  .option("network", {
    type: "string",
    default: "hardhat",
  })
  .help(false)
  .version(false).argv;

// Load environment variables.
dotenv.config();
const { INFURA_KEY, MNEMONIC, ETHERSCAN_API_KEY, PK } = process.env;

const DEFAULT_MNEMONIC =
  "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat";

const sharedNetworkConfig: HttpNetworkUserConfig = {};
if (PK) {
  sharedNetworkConfig.accounts = [PK];
} else {
  sharedNetworkConfig.accounts = {
    mnemonic: MNEMONIC || DEFAULT_MNEMONIC,
  };
}

if (
  ["goerli", "sepolia", "mainnet"].includes(argv.network) &&
  INFURA_KEY === undefined
) {
  throw new Error(
    `Could not find Infura key in env, unable to connect to network ${argv.network}`
  );
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
        version: "0.8.17",
        settings: {
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
      url: `https://mainnet.infura.io/v3/${INFURA_KEY}`,
    },
    goerli: {
      ...sharedNetworkConfig,
      url: `https://goerli.infura.io/v3/${INFURA_KEY}`,
    },
    sepolia: {
      ...sharedNetworkConfig,
      url: `https://sepolia.infura.io/v3/${INFURA_KEY}`,
    },
    gnosis: {
      ...sharedNetworkConfig,
      url: "https://rpc.gnosischain.com/",
    },
    matic: {
      ...sharedNetworkConfig,
      url: "https://rpc-mainnet.maticvigil.com",
    },
  },
  gasReporter: {
    enabled: true,
  },
  mocha: {
    timeout: 2000000,
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
};

export default config;
