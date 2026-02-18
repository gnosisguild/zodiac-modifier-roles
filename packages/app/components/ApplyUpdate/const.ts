// EIP-3722 Poster contract
export const POSTER_ADDRESS =
  "0x000000000000cd17345801aa8147b8D3950260FF" as const

// Morpho Bundler3 contract addresses per chain
export const MORPHO_BUNDLER3: Record<number, `0x${string}`> = {
  1: "0x6566194141eefa99Af43Bb5Aa71460Ca2Dc90245", // Ethereum
  8453: "0x6BFd8137e702540E7A42B74178A4a49Ba43920C4", // Base
}

export const MORPHO_BUNDLER_ADAPTER =
  "0x7533922A155DC6b4Cc0ae4E74D70a73bc86dD3E8" as const

export const MORPHO_BUNDLER_SELECTOR = "0x374f435d" as const

// MultiSend v1.4.1 contract addresses (used in latest Safes)
export const MULTISEND_141 =
  "0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526" as const
export const MULTISEND_CALLONLY_141 =
  "0x9641d764fc13c8B624c04430C7356C1C7C8102e2" as const
export const MULTISEND_SELECTOR = "0x8d80ff0a" as const
export const MULTISEND_UNWRAPPER =
  "0x93B7fCbc63ED8a3a24B59e1C3e6649D50B7427c0" as const
