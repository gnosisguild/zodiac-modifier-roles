import "@typechain/hardhat"
import "@nomiclabs/hardhat-ethers"
import "@nomiclabs/hardhat-waffle"
import "hardhat-deploy"
import "hardhat-watcher"
import dotenv from "dotenv"
import { HardhatUserConfig } from "hardhat/config"
import type { HttpNetworkUserConfig } from "hardhat/types"
import yargs from "yargs"

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
    compilers: [{ version: "0.8.17" }],
    settings: {
      optimizer: {
        enabled: true,
        runs: 100,
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
    gnosis: {
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
  watcher: {
    test: {
      tasks: [{ command: "test" }],
      files: ["./test/**/*", "./src/**/*"],
      verbose: true,
      clearOnStart: true,
      start: "echo Running my test task now..",
    },
  },
}

export default config
