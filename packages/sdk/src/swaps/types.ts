/**
 * Supported chain IDs for COW Protocol
 */
export enum SupportedChainId {
  MAINNET = 1,
  GNOSIS_CHAIN = 100,
  ARBITRUM_ONE = 42161,
  BASE = 8453,
  AVALANCHE = 43114,
  POLYGON = 137,
  SEPOLIA = 11155111,
}

export type OrderKind = "sell" | "buy"

/**
 * Sell token balance source
 */
export type SellTokenBalance = "erc20" | "external" | "internal"

/**
 * Buy token balance destination
 */
export type BuyTokenBalance = "erc20" | "internal"

interface SellOrderRequest {
  kind: "sell"
  sellAmountBeforeFee: bigint
}

interface BuyOrderRequest {
  kind: "buy"
  buyAmountAfterFee: bigint
}

type PriceQuality = "fast" | "optimal"

/**
 * Union type for quote requests
 */
export type QuoteRequest = (SellOrderRequest | BuyOrderRequest) & {
  sellToken: `0x${string}`
  buyToken: `0x${string}`
  receiver?: `0x${string}` | null
  validTo?: number
  partiallyFillable?: boolean
  sellTokenBalance?: SellTokenBalance
  buyTokenBalance?: BuyTokenBalance
  priceQuality?: PriceQuality

  chainId: SupportedChainId
  rolesModifier: `0x${string}`
  roleKey: `0x${string}`
}

export type Quote = {
  sellToken: `0x${string}`
  buyToken: `0x${string}`
  receiver: `0x${string}`
  sellAmount: string
  buyAmount: string
  validTo: number
  appData: string
  appDataHash: string
  networkCostsAmount: string
  kind: OrderKind
  partiallyFillable: boolean
  sellTokenBalance: SellTokenBalance
  buyTokenBalance: BuyTokenBalance

  from: `0x${string}`
  chainId: SupportedChainId
  rolesModifier: `0x${string}`
  roleKey: `0x${string}`
}

/**
 * AppData structure for COW Protocol orders
 */
export interface AppData {
  partnerFee: {
    bps: number
    recipient: string
  }
}

export interface AdvancedOptions {
  appCode?: string
  environment?: string
}
