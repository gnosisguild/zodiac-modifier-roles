import { defineChain } from "viem"
import {
  mainnet,
  sepolia,
  optimism,
  avalanche,
  arbitrum,
  base,
  baseSepolia,
  polygon,
  polygonZkEvm,
  gnosis,
  bsc,
  celo,
  sonic,
  berachain,
  bob,
  unichain,
  mantle,
  ink,
  katana,
  worldchain,
  plasma,
  scroll,
  flare,
} from "wagmi/chains"

const hyperevm = defineChain({
  id: 999,
  name: "HyperEVM",
  nativeCurrency: {
    decimals: 18,
    name: "HYPE",
    symbol: "HYPE",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.hypurrscan.io"],
    },
  },
  blockExplorers: {
    default: { name: "HyperEVMScan", url: "https://hyperevmscan.io" },
  },
  contracts: {
    multicall3: {
      address: "0xcA11bde05977b3631167028862bE2a173976CA11",
      blockCreated: 13051,
    },
  },
})

export const CHAINS = {
  [mainnet.id]: {
    ...mainnet,
    prefix: "eth",
  },
  [gnosis.id]: {
    ...gnosis,
    prefix: "gno",
  },
  [optimism.id]: {
    ...optimism,
    prefix: "oeth",
  },
  [polygon.id]: {
    ...polygon,
    prefix: "matic",
  },
  [polygonZkEvm.id]: {
    ...polygonZkEvm,
    prefix: "zkevm",
  },
  [avalanche.id]: {
    ...avalanche,
    prefix: "avax",
  },
  [arbitrum.id]: {
    ...arbitrum,
    prefix: "arb1",
  },
  [bsc.id]: {
    ...bsc,
    prefix: "bnb",
  },
  [base.id]: {
    ...base,
    prefix: "base",
  },
  [celo.id]: {
    ...celo,
    prefix: "celo",
  },
  [sonic.id]: {
    ...sonic,
    prefix: "sonic",
  },
  [berachain.id]: {
    ...berachain,
    prefix: "berachain",
  },
  [baseSepolia.id]: {
    ...baseSepolia,
    prefix: "basesep",
  },
  [sepolia.id]: {
    ...sepolia,
    prefix: "sep",
  },
  [unichain.id]: {
    ...unichain,
    prefix: "unichain",
  },
  [mantle.id]: {
    ...mantle,
    prefix: "mantle",
  },
  [bob.id]: {
    ...bob,
    prefix: "bob",
  },
  [ink.id]: {
    ...ink,
    prefix: "ink",
  },
  [katana.id]: {
    ...katana,
    prefix: "katana",
  },
  [worldchain.id]: {
    ...worldchain,
    prefix: "wc",
  },
  [hyperevm.id]: {
    ...hyperevm,
    prefix: "hyperevm",
  },
  [plasma.id]: {
    ...plasma,
    prefix: "plasma",
  },
  [scroll.id]: {
    ...scroll,
    prefix: "scroll",
  },
  [flare.id]: {
    ...flare,
    prefix: "flare",
  },
}

export type ChainId = keyof typeof CHAINS

export const DEFAULT_CHAIN = CHAINS[1]
