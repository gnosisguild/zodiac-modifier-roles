export const chains = {
  [1]: {
    name: "mainnet",
    prefix: "eth",
    subgraphDeploymentId: "QmSXFnZr641zZforeXRAGHfynCEi1Vq35AKQ8qB1W1CdU6",
  },
  [10]: {
    name: "optimism",
    prefix: "oeth",
    subgraph:
      "https://api.studio.thegraph.com/query/93263/zodiac-roles-optimism/v2.3.4",
    subgraphDeploymentId: "Q...",
  },
  [100]: {
    name: "gnosis",
    prefix: "gno",
    subgraph:
      "https://api.studio.thegraph.com/query/93263/zodiac-roles-gnosis/v2.3.4",
    subgraphDeploymentId: "QmR1TkpcQzhBfUwmRJfeV4kQbUbDUZUvyWxtLTCYkiivvz",
  },
  [137]: {
    name: "polygon",
    prefix: "matic",
    subgraph:
      "https://api.studio.thegraph.com/query/93263/zodiac-roles-polygon/v2.3.4",
    subgraphDeploymentId: "Q...",
  },
  [1101]: {
    name: "zkevm",
    prefix: "zkevm",
    subgraph:
      "https://api.studio.thegraph.com/query/93263/zodiac-roles-zkevm/v2.3.4",
    subgraphDeploymentId: "Q...",
  },
  [42161]: {
    name: "arbitrumOne",
    prefix: "arb1",
    subgraph:
      "https://api.studio.thegraph.com/query/93263/zodiac-roles-arbitrum-one/v2.3.4",
    subgraphDeploymentId: "Q...",
  },
  [43114]: {
    name: "avalanche",
    prefix: "avax",
    subgraph:
      "https://api.studio.thegraph.com/query/93263/zodiac-roles-avalanche/v2.3.4",
    subgraphDeploymentId: "Q...",
  },
  [56]: {
    name: "bsc",
    prefix: "bnb",
    subgraph:
      "https://api.studio.thegraph.com/query/93263/zodiac-roles-bsc/v2.3.4",
    subgraphDeploymentId: "Q...",
  },
  [8453]: {
    name: "base",
    prefix: "base",
    subgraph:
      "https://api.studio.thegraph.com/query/93263/zodiac-roles-base/v2.3.4",
    subgraphDeploymentId: "Q...",
  },
  [84532]: {
    name: "baseSepolia",
    prefix: "basesep",
    subgraph:
      "https://api.studio.thegraph.com/query/93263/zodiac-roles-base-sepolia/v2.3.4",
    subgraphDeploymentId: "Q...",
  },
  [11155111]: {
    name: "sepolia",
    prefix: "sep",
    subgraph:
      "https://api.studio.thegraph.com/query/93263/zodiac-roles-sepolia/v2.3.4",
    subgraphDeploymentId: "Q...",
  },
} as const
