/**
 * Chain IDs where the CowOrderSigner contract is deployed.
 * This is a subset of chains supported by cow-sdk.
 *
 * TODO: Deploy CowOrderSigner contract to these additional cow-sdk chains:
 * - BNB (56)
 * - LENS (232)
 * - PLASMA (9745)
 * - LINEA (59144)
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

interface SellOrderRequest {
  kind: "sell"
  sellAmountBeforeFee: bigint
}

interface BuyOrderRequest {
  kind: "buy"
  buyAmountAfterFee: bigint
}

/**
 * Request parameters for getting a CowSwap quote.
 */
export type QuoteRequest = (SellOrderRequest | BuyOrderRequest) & {
  sellToken: `0x${string}`
  buyToken: `0x${string}`
  receiver?: `0x${string}` | null
  validTo?: number
  partiallyFillable?: boolean
  sellTokenBalance?: "erc20" | "external" | "internal"
  buyTokenBalance?: "erc20" | "internal"
  priceQuality?: "fast" | "optimal"

  chainId: SupportedChainId
  rolesModifier: `0x${string}`
  roleKey: `0x${string}`
}

/**
 * Quote returned by getCowQuote, used as input for signCowOrder and postCowOrder.
 */
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
  kind: "sell" | "buy"
  partiallyFillable: boolean
  sellTokenBalance: "erc20" | "external" | "internal"
  buyTokenBalance: "erc20" | "internal"

  from: `0x${string}`
  chainId: SupportedChainId
  rolesModifier: `0x${string}`
  roleKey: `0x${string}`
}

/**
 * Advanced options for getCowQuote.
 */
export interface AdvancedOptions {
  appCode?: string
  environment?: string
}
