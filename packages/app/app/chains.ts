import {
  mainnet,
  sepolia,
  // avalanche,
  arbitrum,
  bsc,
  polygon,
  // polygonMumbai,
  gnosis,
} from "@wagmi/core/chains"; // cannot import from wagmi/chains because that one declares "use client;"

export const CHAINS = {
  [mainnet.id]: { ...mainnet, prefix: "eth" },
  [gnosis.id]: { ...gnosis, prefix: "gno" },
  [polygon.id]: { ...polygon, prefix: "matic" },
  // [avalanche.id]: { ...avalanche, prefix: "avax" },
  [arbitrum.id]: { ...arbitrum, prefix: "arb1" },
  [bsc.id]: { ...bsc, prefix: "bnb" },

  // [sepolia.id]: { ...sepolia, prefix: "sep" },
  // [polygonMumbai.id]: { ...polygonMumbai, prefix: "maticmum" },
};

export type ChainId = keyof typeof CHAINS;

export const DEFAULT_CHAIN = CHAINS[1];
