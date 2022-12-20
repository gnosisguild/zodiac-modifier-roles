import { defineConfig } from "@dethcrypto/eth-sdk"

export default defineConfig({
  contracts: {
    mainnet: {
      uniswap: {
        nftPositions: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
        test: "0x0000000000000000000000000000000000000000",
      },
    },
  },
})
