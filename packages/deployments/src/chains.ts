export const chains = {
  [1]: {
    name: "mainnet",
    prefix: "eth",
  },
  [10]: {
    name: "optimism",
    prefix: "oeth",
  },
  [100]: {
    name: "gnosis",
    prefix: "gno",
  },
  [137]: {
    name: "polygon",
    prefix: "matic",
  },
  [1101]: {
    name: "zkevm",
    prefix: "zkevm",
  },
  [42161]: {
    name: "arbitrumOne",
    prefix: "arb1",
  },
  [43114]: {
    name: "avalanche",
    prefix: "avax",
  },
  [56]: {
    name: "bsc",
    prefix: "bnb",
  },
  [8453]: {
    name: "base",
    prefix: "base",
  },
  [42220]: {
    name: "celo",
    prefix: "celo",
  },
  [146]: {
    name: "sonic",
    prefix: "sonic",
  },
  [80094]: {
    name: "berachain",
    prefix: "berachain",
  },
  [84532]: {
    name: "baseSepolia",
    prefix: "basesep",
  },
  [11155111]: {
    name: "sepolia",
    prefix: "sep",
  },
} as const
