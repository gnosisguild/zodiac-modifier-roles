import CHAINS from "../data/chains.json"

const INFURA_KEY = process.env.REACT_APP_INFURA_KEY as string
if (!INFURA_KEY) throw new Error("INFURA KEY NOT SET")

export enum Network {
  MAINNET = 1,
  GOERLI = 5,
  OPTIMISM = 10,
  OPTIMISM_ON_GNOSIS = 300,
  BINANCE = 56,
  GNOSIS = 100,
  POLYGON = 137,
  EWT = 246,
  ARBITRUM = 42161,
  AVALANCHE = 43114,
  VOLTA = 73799,
  AURORA = 1313161554,
}

export const NETWORKS = [
  Network.MAINNET,
  Network.GOERLI,
  Network.OPTIMISM,
  Network.BINANCE,
  Network.GNOSIS,
  Network.POLYGON,
  Network.EWT,
  Network.ARBITRUM,
  Network.AVALANCHE,
  Network.VOLTA,
  Network.AURORA,
]

interface NetworkConfig {
  name: string
  chainId: number
  shortName: string
  rpc: string[]
  infoURL: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  explorers: {
    name: string
    url: string
    standard: string
  }[]
}

export function getNetworkRPC(network: Network) {
  const config = getNetwork(network)
  if (config) {
    // eslint-disable-next-line no-template-curly-in-string
    return config.rpc[0].replace("${INFURA_API_KEY}", INFURA_KEY)
  }
}

export function getNetwork(network: Network): NetworkConfig {
  return CHAINS[network]
}
