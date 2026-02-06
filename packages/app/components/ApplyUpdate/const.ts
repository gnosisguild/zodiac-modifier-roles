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
