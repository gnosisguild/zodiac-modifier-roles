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
} from "wagmi/chains"

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
  [optimism.id]: {
    ...optimism,
    prefix: "oeth",
    blockExplorerAbiUrl: "https://api-optimistic.etherscan.io/api",
    blockExplorerApiKey: "SM2FQ62U49I6H9V9CCEGFS34QGBK4IIJPH",
  },
  [polygon.id]: {
    ...polygon,
    prefix: "matic",
    blockExplorerAbiUrl: "https://api.polygonscan.com/api",
    blockExplorerApiKey: "NM937M1IZXVQ6QVDXS73XMF8JSAB677JWQ",
  },
  [polygonZkEvm.id]: {
    ...polygonZkEvm,
    prefix: "zkevm",
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
  [bsc.id]: {
    ...bsc,
    prefix: "bnb",
    blockExplorerAbiUrl: "https://api.bscscan.com/api",
    blockExplorerApiKey: "B2E3G4MB7UM7Y9BSD7JHK57UI2UQK88YUW",
  },
  [base.id]: {
    ...base,
    prefix: "base",
    blockExplorerAbiUrl: "https://api.basescan.org/api",
    blockExplorerApiKey: "KCC7EQHE17IAQZA9TICUS6BQTJGZUDRNIY",
  },
  [celo.id]: {
    ...celo,
    prefix: "celo",
    blockExplorerAbiUrl: "https://api.celoscan.io/api",
    blockExplorerApiKey: "2PFFN9NR94F9XQBFMCI6VXHVXRGNXNP2E2",
  },
  [sonic.id]: {
    ...sonic,
    prefix: "sonic",
    blockExplorerAbiUrl: "https://api.sonicscan.org/api",
    blockExplorerApiKey: "4PKXQYT2DGQXHSINRFY4UM8RUFJHR9V1TX",
  },
  [berachain.id]: {
    ...berachain,
    prefix: "berachain",
    blockExplorerAbiUrl: "https://api.berascan.com/api",
    blockExplorerApiKey: "X39RQV6MWGUB3W4NC4VI6YM4MTYMCFN8Y9",
  },
  [baseSepolia.id]: {
    ...baseSepolia,
    prefix: "basesep",
    blockExplorerAbiUrl: "https://api-sepolia.basescan.org/api",
    blockExplorerApiKey: "KCC7EQHE17IAQZA9TICUS6BQTJGZUDRNIY",
  },
  [sepolia.id]: {
    ...sepolia,
    prefix: "sep",
    blockExplorerAbiUrl: "https://api-sepolia.etherscan.io/api",
    blockExplorerApiKey: "6RJ8KT4B1S9V7E3CIYECNY7HFW8IPWQ3C4",
  },
}

export type ChainId = keyof typeof CHAINS

export const DEFAULT_CHAIN = CHAINS[1]
