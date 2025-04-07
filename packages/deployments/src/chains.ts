export const chains = {
  [1]: {
    name: "mainnet",
    prefix: "eth",
    subgraphDeploymentId: "QmSXFnZr641zZforeXRAGHfynCEi1Vq35AKQ8qB1W1CdU6",
  },
  [10]: {
    name: "optimism",
    prefix: "oeth",
    subgraphDeploymentId: "QmeJXG1sWpdbqs4nZE9JFs2j9nGuFLH4VCmbCVXP7oQh9d",
  },
  [100]: {
    name: "gnosis",
    prefix: "gno",
    subgraphDeploymentId: "QmR1TkpcQzhBfUwmRJfeV4kQbUbDUZUvyWxtLTCYkiivvz",
  },
  [137]: {
    name: "polygon",
    prefix: "matic",
    subgraphDeploymentId: "QmVrtFGzKJcuCbdbeaCAmhzJeVpkqrySNwvaCiVSpip4cm",
  },
  [1101]: {
    name: "zkevm",
    prefix: "zkevm",
    subgraphDeploymentId: "QmctRf4gwTT63t2SNT4pFekHfjjHyV97jX8CaMQdrUBS4y",
  },
  [42161]: {
    name: "arbitrumOne",
    prefix: "arb1",
    subgraphDeploymentId: "QmPBUT8onznz5kocjwzzQPoRatu8gSPAaaSra7jixaF1mD",
  },
  [43114]: {
    name: "avalanche",
    prefix: "avax",
    subgraphDeploymentId: "QmSegJhx8SEQ5WFfi6ZLQLs8XRSfLoka7yULsUKgeGBLnT",
  },
  [56]: {
    name: "bsc",
    prefix: "bnb",
    subgraphDeploymentId: "QmUM9dfkiN5jHMxUzPYHW8tKguPr65qnWpzb3dRMKT1kDc",
  },
  [8453]: {
    name: "base",
    prefix: "base",
    subgraphDeploymentId: "QmWGQfg86sAjZUQ2HUeHN4mVQTejFb1XPPtLLoz2Ks7Wfp",
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
    subgraphDeploymentId: "QmSZuUNsMtLjN9Gd4sNu7rCGChZ56NQc2XY7kN3YLz9pQD",
  },
  [11155111]: {
    name: "sepolia",
    prefix: "sep",
    subgraphDeploymentId: "QmdeXJ7g889wK4wDNpRrvKGN91SZiwvdmCU9dFQsgqaQ3K",
  },
} as const
