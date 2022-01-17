export enum NETWORK {
  MAINNET = 1,
  RINKEBY = 4,
  XDAI = 100,
  POLYGON = 137,
}

export interface Coin {
  symbol: string
  decimals: number
}

export const NATIVE_ASSET: Record<string, Coin> = {
  ETH: { symbol: 'ETH', decimals: 18 },
  XDAI: { symbol: 'xDai', decimals: 18 },
  MATIC: { symbol: 'MATIC', decimals: 18 },
}

export const NETWORK_NATIVE_ASSET: Record<NETWORK, Coin> = {
  [NETWORK.MAINNET]: NATIVE_ASSET.ETH,
  [NETWORK.RINKEBY]: NATIVE_ASSET.ETH,
  [NETWORK.XDAI]: NATIVE_ASSET.XDAI,
  [NETWORK.POLYGON]: NATIVE_ASSET.MATIC,
}

export const NETWORK_NAME: Record<NETWORK, string> = {
  [NETWORK.MAINNET]: 'Mainnet',
  [NETWORK.RINKEBY]: 'Rinkeby',
  [NETWORK.XDAI]: 'Gnosis Chain',
  [NETWORK.POLYGON]: 'Polygon',
}

export const NETWORK_DEFAULT_RPC: Record<NETWORK, string> = {
  [NETWORK.MAINNET]: 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
  [NETWORK.RINKEBY]: 'https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
  [NETWORK.XDAI]: 'https://rpc.xdaichain.com',
  [NETWORK.POLYGON]: 'https://polygon-rpc.com',
}

export function getNetworkNativeAsset(network: NETWORK) {
  return NETWORK_NATIVE_ASSET[network]
}

export function getNetworkRPC(network: NETWORK) {
  return NETWORK_DEFAULT_RPC[network]
}

export function getNetworkName(network: NETWORK) {
  return NETWORK_NAME[network]
}
