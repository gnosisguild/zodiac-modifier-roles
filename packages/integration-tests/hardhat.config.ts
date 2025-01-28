import { HardhatUserConfig } from "hardhat/types"
import "@nomicfoundation/hardhat-ethers"

import evmConfig from "../evm/hardhat.config"

const config: HardhatUserConfig = {
  ...evmConfig,
  paths: {
    root: "../evm",
    artifacts: "build/artifacts",
    cache: "build/cache",
    sources: "contracts",
    tests: "../integration-tests/test",
  },
  mocha: {
    timeout: 2000000,
  },
}

export default config
