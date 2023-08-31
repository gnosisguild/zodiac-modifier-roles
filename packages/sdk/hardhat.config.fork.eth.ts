import { HardhatUserConfig } from "hardhat/types"

import config from "./hardhat.config"

export default {
  ...config,
  networks: {
    ...config.networks,
    hardhat: {
      forking: {
        url: config.networks.mainnet.url,
      },
    },
  },
} satisfies HardhatUserConfig
