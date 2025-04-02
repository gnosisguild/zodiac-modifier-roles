export const chains = {
  [1]: {
    name: "mainnet",
    prefix: "eth",
    subgraph:
      "https://api.studio.thegraph.com/query/93263/zodiac-roles-mainnet/v2.3.4",
  },
  [10]: {
    name: "optimism",
    prefix: "oeth",
    subgraph:
      "https://api.studio.thegraph.com/query/93263/zodiac-roles-optimism/v2.3.4",
  },
  [100]: {
    name: "gnosis",
    prefix: "gno",
    subgraph:
      "https://api.studio.thegraph.com/query/93263/zodiac-roles-gnosis/v2.3.4",
  },
  [137]: {
    name: "polygon",
    prefix: "matic",
    subgraph:
      "https://api.studio.thegraph.com/query/93263/zodiac-roles-polygon/v2.3.4",
  },
  [1101]: {
    name: "zkevm",
    prefix: "zkevm",
    subgraph:
      "https://api.studio.thegraph.com/query/93263/zodiac-roles-zkevm/v2.3.4",
  },
  [42161]: {
    name: "arbitrumOne",
    prefix: "arb1",
    subgraph:
      "https://api.studio.thegraph.com/query/93263/zodiac-roles-arbitrum-one/v2.3.4",
  },
  [43114]: {
    name: "avalanche",
    prefix: "avax",
    subgraph:
      "https://api.studio.thegraph.com/query/93263/zodiac-roles-avalanche/v2.3.4",
  },
  [56]: {
    name: "bsc",
    prefix: "bnb",
    subgraph:
      "https://api.studio.thegraph.com/query/93263/zodiac-roles-bsc/v2.3.4",
  },
  [8453]: {
    name: "base",
    prefix: "base",
    subgraph:
      "https://api.studio.thegraph.com/query/93263/zodiac-roles-base/v2.3.4",
  },
  [42220]: {
    name: "celo",
    prefix: "celo",
    subgraph:
      "https://api.studio.thegraph.com/query/93263/zodiac-roles-celo/v2.3.5",
  },
  [146]: {
    name: "sonic",
    prefix: "sonic",
    subgraph:
      "https://api.studio.thegraph.com/query/93263/zodiac-roles-sonic/v2.3.5",
  },
  [80094]: {
    name: "berachain",
    prefix: "berachain",
    subgraph:
      "https://api.studio.thegraph.com/query/93263/zodiac-roles-berachain/v2.3.5",
  },
  [84532]: {
    name: "baseSepolia",
    prefix: "basesep",
    subgraph:
      "https://api.studio.thegraph.com/query/93263/zodiac-roles-base-sepolia/v2.3.4",
  },
  [11155111]: {
    name: "sepolia",
    prefix: "sep",
    subgraph:
      "https://api.studio.thegraph.com/query/93263/zodiac-roles-sepolia/v2.3.4",
  },
} as const
