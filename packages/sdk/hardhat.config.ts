import "@typechain/hardhat"
import "@nomiclabs/hardhat-ethers"
import "@nomiclabs/hardhat-waffle"
import "hardhat-deploy"
import dotenv from "dotenv"
import { HardhatUserConfig } from "hardhat/config"
import type { HttpNetworkUserConfig } from "hardhat/types"
import yargs from "yargs"

import "./tasks/manageKarpatkeyRoles"

const argv = yargs
  .option("network", {
    type: "string",
    default: "hardhat",
  })
  .help(false)
  .version(false).argv

// Load environment variables.
dotenv.config()
const { INFURA_KEY, MNEMONIC, PK } = process.env

const DEFAULT_MNEMONIC =
  "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat"

const sharedNetworkConfig: HttpNetworkUserConfig = {}
if (PK) {
  sharedNetworkConfig.accounts = [PK]
} else {
  sharedNetworkConfig.accounts = {
    mnemonic: MNEMONIC || DEFAULT_MNEMONIC,
  }
}

if (["goerli", "mainnet"].includes(argv.network) && INFURA_KEY === undefined) {
  throw new Error(
    `Could not find Infura key in env, unable to connect to network ${argv.network}`
  )
}

const config: HardhatUserConfig = {
  paths: {
    root: "../evm",
    artifacts: "build/artifacts",
    cache: "build/cache",
    sources: "contracts",
    tests: "../sdk/test",
  },
  solidity: {
    compilers: [{ version: "0.8.6" }, { version: "0.6.12" }],
    settings: {
      optimizer: {
        enabled: true,
        runs: 1,
      },
    },
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
    goerli: {
      ...sharedNetworkConfig,
      url: `https://goerli.infura.io/v3/${INFURA_KEY}`,
    },
    xdai: {
      ...sharedNetworkConfig,
      chainId: 100,
      url: "https://rpc.gnosischain.com/",
    },
    matic: {
      ...sharedNetworkConfig,
      url: "https://rpc-mainnet.maticvigil.com",
    },
  },
  mocha: {
    timeout: 2000000,
  },
}

export default config
