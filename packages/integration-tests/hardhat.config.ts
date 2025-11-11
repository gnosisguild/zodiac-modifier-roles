import { HardhatUserConfig } from "hardhat/types"
import "@nomicfoundation/hardhat-toolbox"
import "@nomicfoundation/hardhat-ethers"

const config: HardhatUserConfig = {
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
  },
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
