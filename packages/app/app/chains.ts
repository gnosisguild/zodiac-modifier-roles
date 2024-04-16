import {
  mainnet,
  sepolia,
  // optimism,
  avalanche,
  arbitrum,
  // bsc,
  polygon,
  polygonMumbai,
  gnosis,
} from "@wagmi/core/chains" // cannot import from wagmi/chains because that one declares "use client;"

export const CHAINS = {
  [mainnet.id]: {
    ...mainnet,
    prefix: "eth",
    blockExplorerAbiUrl: "https://api.etherscan.io/api",
    blockExplorerApiKey: "6RJ8KT4B1S9V7E3CIYECNY7HFW8IPWQ3C4",
  },
  [gnosis.id]: {
    ...gnosis,
    prefix: "gno",
    blockExplorerAbiUrl: "https://api.gnosisscan.io/api",
    blockExplorerApiKey: "8ENCUFT4D3XVJS7N9ZFS5Z9XQPNUGRKSN5",
  },
  // [optimism.id]: {
  //   ...optimism,
  //   prefix: "oeth",
  //   blockExplorerAbiUrl: "https://api-optimistic.etherscan.io/api",
  //   blockExplorerApiKey: "6RJ8KT4B1S9V7E3CIYECNY7HFW8IPWQ3C4",
  // },
  [polygon.id]: {
    ...polygon,
    prefix: "matic",
    blockExplorerAbiUrl: "https://api.polygonscan.com/api",
    blockExplorerApiKey: "NM937M1IZXVQ6QVDXS73XMF8JSAB677JWQ",
  },
  [avalanche.id]: {
    ...avalanche,
    prefix: "avax",
    blockExplorerAbiUrl: "https://api.snowtrace.io/api",
    blockExplorerApiKey: "notrequired",
  },
  [arbitrum.id]: {
    ...arbitrum,
    prefix: "arb1",
    blockExplorerAbiUrl: "https://api.arbiscan.io/api",
    blockExplorerApiKey: "CSITWCYI9UDAJ7QS92FNVJ2XQP5B23P4J9",
  },
  // [bsc.id]: {
  //   ...bsc,
  //   prefix: "bnb",
  //   blockExplorerAbiUrl: "https://api.bscscan.com/api",
  //   blockExplorerApiKey: "AMXEAU3N9P7RJHFSZ7KAJDRY5MFJ1N29D6",
  // },

  [sepolia.id]: {
    ...sepolia,
    prefix: "sep",
    blockExplorerAbiUrl: "https://api-sepolia.etherscan.io/api",
    blockExplorerApiKey: "6RJ8KT4B1S9V7E3CIYECNY7HFW8IPWQ3C4",
  },
  [polygonMumbai.id]: {
    ...polygonMumbai,
    prefix: "maticmum",
    blockExplorerAbiUrl: "https://api-mumbai.polygonscan.com/api",
    blockExplorerApiKey: "NM937M1IZXVQ6QVDXS73XMF8JSAB677JWQ",
  },
}

export type ChainId = keyof typeof CHAINS

export const DEFAULT_CHAIN = CHAINS[1]
