import { defineConfig } from "@gnosis-guild/eth-sdk"

import { ethSdkConfig } from "../../sdk/src/ethSdk"

export default defineConfig({
  ...ethSdkConfig,
  contracts: {
    mainnet: {
      lido: {
        stETH: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
      },
    },
  },
})
