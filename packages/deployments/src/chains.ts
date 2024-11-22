export const chains = {
  [1]: {
    name: "mainnet",
    prefix: "eth",
    subgraph:
      "https://api.studio.thegraph.com/query/93263/zodiac-roles-mainnet/v2.3.0",
  },
  [10]: {
    name: "optimism",
    prefix: "oeth",
    subgraph:
      "https://api.studio.thegraph.com/query/93263/zodiac-roles-optimism/v2.3.0",
  },
  [100]: {
    name: "gnosis",
    prefix: "gno",
    subgraph:
      "https://api.studio.thegraph.com/query/93263/zodiac-roles-gnosis/v2.3.0",
  },
  [137]: {
    name: "polygon",
    prefix: "matic",
    subgraph:
      "https://api.studio.thegraph.com/query/93263/zodiac-roles-polygon/v2.3.0",
  },
  [1101]: {
    name: "zkevm",
    prefix: "zkevm",
    subgraph:
      "https://api.studio.thegraph.com/query/93263/zodiac-roles-zkevm/v2.3.0",
  },
  [42161]: {
    name: "arbitrumOne",
    prefix: "arb1",
    subgraph:
      "https://api.studio.thegraph.com/query/93263/zodiac-roles-arbitrum-one/v2.3.0",
  },
  [43114]: {
    name: "avalanche",
    prefix: "avax",
    subgraph:
      "https://api.studio.thegraph.com/query/93263/zodiac-roles-avalanche/v2.3.0",
  },
  [56]: {
    name: "bsc",
    prefix: "bnb",
    subgraph:
      "https://api.studio.thegraph.com/query/93263/zodiac-roles-bsc/v2.3.0",
  },
  [8453]: {
    name: "base",
    prefix: "base",
    subgraph:
      "https://api.studio.thegraph.com/query/93263/zodiac-roles-base/v2.3.0",
  },
  [84532]: {
    name: "baseSepolia",
    prefix: "basesep",
    subgraph:
      "https://api.studio.thegraph.com/query/93263/zodiac-roles-base-sepolia/v2.3.0",
  },
  [11155111]: {
    name: "sepolia",
    prefix: "sep",
    subgraph:
      "https://api.studio.thegraph.com/query/93263/zodiac-roles-sepolia/v2.3.0",
  },
} as const
