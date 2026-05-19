import { HardhatUserConfig } from "hardhat/types"
import "@nomicfoundation/hardhat-toolbox"
import "@nomicfoundation/hardhat-ethers"

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.30",
        settings: {
          evmVersion: "cancun",
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
    // Isolate artifacts/cache from the EVM package's own `build/` so the two
    // packages don't race on the same Hardhat artifact files when `turbo test`
    // runs them in parallel.
    artifacts: "../integration-tests/build/artifacts",
    cache: "../integration-tests/build/cache",
    sources: "contracts",
    tests: "../integration-tests/test",
  },
  mocha: {
    timeout: 2000000,
  },
}

export default config
