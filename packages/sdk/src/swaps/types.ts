/**
 * Supported chain IDs for COW Protocol
 */
export enum SupportedChainId {
  MAINNET = 1,
  GNOSIS_CHAIN = 100,
  ARBITRUM_ONE = 42161,
  BASE = 8453,
  SEPOLIA = 11155111,
}

/**
 * Order kind - sell or buy
 */
export type OrderKind = "sell" | "buy"

/**
 * Sell token balance source
 */
export type SellTokenBalance = "erc20" | "external" | "internal"

/**
 * Buy token balance destination
 */
export type BuyTokenBalance = "erc20" | "internal"

/**
 * Price quality for quotes
 */
export type PriceQuality = "fast" | "optimal"

/**
 * Signing scheme for orders
 */
export type SigningScheme = "eip712" | "ethsign" | "eip1271" | "presign"

/**
 * Quote request for sell orders with amount before fee
 */
export interface SellOrderRequest {
  kind: "sell"
  sellAmountBeforeFee: bigint
  sellToken: `0x${string}`
  buyToken: `0x${string}`
  receiver?: `0x${string}` | null
  validTo?: number
  partiallyFillable?: boolean
  sellTokenBalance?: SellTokenBalance
  buyTokenBalance?: BuyTokenBalance
  priceQuality?: PriceQuality
  signingScheme?: SigningScheme
  chainId: SupportedChainId
  rolesModifier: `0x${string}`
}

/**
 * Quote request for buy orders
 */
export interface BuyOrderRequest {
  kind: "buy"
  buyAmountAfterFee: bigint
  sellToken: `0x${string}`
  buyToken: `0x${string}`
  receiver?: `0x${string}` | null
  validTo?: number
  partiallyFillable?: boolean
  sellTokenBalance?: SellTokenBalance
  buyTokenBalance?: BuyTokenBalance
  priceQuality?: PriceQuality
  signingScheme?: SigningScheme
  chainId: SupportedChainId
  rolesModifier: `0x${string}`
}

/**
 * Union type for quote requests
 */
export type QuoteRequest = SellOrderRequest | BuyOrderRequest

/**
 * COW Protocol API quote request
 */
export interface CowQuoteRequest {
  sellToken: string
  buyToken: string
  kind: OrderKind
  sellAmountBeforeFee?: string
  sellAmountAfterFee?: string
  buyAmountAfterFee?: string
  from: string
  receiver?: string
  validTo?: number
  appData?: string
  partiallyFillable?: boolean
  sellTokenBalance?: SellTokenBalance
  buyTokenBalance?: BuyTokenBalance
  priceQuality?: PriceQuality
  signingScheme?: SigningScheme
  onchainOrder?: boolean
}

/**
 * COW Protocol API quote response
 */
export interface CowQuoteResponse {
  quote: {
    sellToken: string
    buyToken: string
    receiver: string
    sellAmount: string
    buyAmount: string
    validTo: number
    appData: string
    feeAmount: string
    kind: string
    partiallyFillable: boolean
    sellTokenBalance: string
    buyTokenBalance: string
  }
  from: string
  expiration: number
  id?: number
}

/**
 * COW Protocol API error
 */
export interface CowApiError {
  errorType: string
  description: string
}
