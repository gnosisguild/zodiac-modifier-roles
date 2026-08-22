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
  megaeth,
  hyperEvm as hyperEvmBase,
  unichainSepolia,
} from "wagmi/chains"

const hyperEvm = defineChain({
  ...hyperEvmBase,
  contracts: {
    ...hyperEvmBase.contracts,
    multicall3: {
      address: "0xcA11bde05977b3631167028862bE2a173976CA11",
      blockCreated: 13051,
    },
  },
})

const BASE_CHAINS = {
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
  [hyperEvm.id]: {
    ...hyperEvm,
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
  [megaeth.id]: {
    ...megaeth,
    prefix: "megaeth",
  },
  [unichainSepolia.id]: {
    ...unichainSepolia,
    prefix: "unichainsep",
  },
}

/**
 * Override every chain's default RPC with our own reliable endpoint. viem's
 * built-in defaults (e.g. https://eth.merkle.io for mainnet) rate-limit and
 * block CORS from the browser. This covers any code path that falls back to
 * `chain.rpcUrls` instead of an explicit transport — notably the wagmi `mock`
 * connector used for dev wallet spoofing, which reads
 * `chain.rpcUrls.default.http[0]` directly and ignores configured transports.
 */
export const CHAINS = Object.fromEntries(
  Object.entries(BASE_CHAINS).map(([id, chain]) => [
    Number(id),
    {
      ...chain,
      rpcUrls: {
        ...chain.rpcUrls,
        default: { http: [`https://rpc.gnosisguild.org/${id}`] },
      },
    },
  ])
) as unknown as typeof BASE_CHAINS

export type ChainId = keyof typeof CHAINS

export const DEFAULT_CHAIN = CHAINS[1]
