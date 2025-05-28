import { SupportedChainId } from "./types"
import type { OrderKind, SellTokenBalance, BuyTokenBalance } from "./types"

/**
 * COW Protocol API quote request
 */
interface CowQuoteRequest {
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
  priceQuality?: "fast" | "optimal"
  signingScheme?: "eip712" | "ethsign" | "eip1271" | "presign"
  onchainOrder?: boolean
}

/**
 * COW Protocol API quote response
 */
interface CowQuoteResponse {
  quote: {
    sellToken: string
    buyToken: string
    receiver: string
    sellAmount: string
    buyAmount: string
    validTo: number
    appData: string
    appDataHash: string
    feeAmount: string
    kind: OrderKind
    partiallyFillable: boolean
    sellTokenBalance: SellTokenBalance
    buyTokenBalance: BuyTokenBalance
  }
  from: string
  expiration: number
  id?: number
}

/**
 * COW Protocol API order request for posting signed orders
 */
interface CowOrderRequest {
  sellToken: string
  buyToken: string
  sellAmount: string
  buyAmount: string
  validTo: number
  appData: string
  feeAmount: string
  kind: OrderKind
  partiallyFillable: boolean
  sellTokenBalance?: SellTokenBalance
  buyTokenBalance?: BuyTokenBalance
  from: string
  signature: string
  signingScheme: "eip712" | "ethsign" | "eip1271" | "presign"
  quoteId?: number
}

/**
 * COW Protocol API order response after posting
 */
interface CowOrderResponse {
  orderId: string
}

/**
 * COW Protocol API error
 */
interface CowApiError {
  errorType: string
  description: string
}

/**
 * Supported COW Protocol networks and their corresponding API network identifiers
 */
const NETWORK_MAP: Record<SupportedChainId, string> = {
  [SupportedChainId.MAINNET]: "mainnet",
  [SupportedChainId.GNOSIS_CHAIN]: "xdai",
  [SupportedChainId.ARBITRUM_ONE]: "arbitrum_one",
  [SupportedChainId.BASE]: "base",
  [SupportedChainId.SEPOLIA]: "sepolia",
}

/**
 * COW Protocol API base URLs for production environment
 */
const COW_API_BASE_URL = "https://api.cow.fi"

/**
 * Error class for COW Protocol API errors
 */
export class CowOrderbookApiError extends Error {
  public readonly apiError?: CowApiError

  constructor(message: string, apiError?: CowApiError) {
    super(message)
    this.name = "CowOrderbookApiError"
    this.apiError = apiError
  }
}

/**
 * Get the base URL for the COW Protocol API for the given chain
 */
function getApiBaseUrl(chainId: SupportedChainId): string {
  const network = NETWORK_MAP[chainId]
  if (!network) {
    throw new Error(`Unsupported chain ID: ${chainId}`)
  }
  return `${COW_API_BASE_URL}/${network}`
}

/**
 * Make a request to the COW Protocol API
 */
async function apiCall<T>(
  baseUrl: string,
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${baseUrl}/api/v1/${endpoint}`

  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    })

    const body = await response.text()

    if (!response.ok) {
      let apiError: CowApiError | undefined
      try {
        apiError = JSON.parse(body) as CowApiError
      } catch {
        // Failed to parse API error, will be undefined
      }

      throw new CowOrderbookApiError(
        `API call to ${url} failed with status ${response.status}: ${body}`,
        apiError
      )
    }

    return JSON.parse(body) as T
  } catch (error) {
    if (error instanceof CowOrderbookApiError) {
      throw error
    }
    throw new CowOrderbookApiError(
      `Network error when calling ${url}: ${error}`
    )
  }
}

/**
 * Get a quote for a COW Protocol order
 *
 * @param chainId - The chain ID to get a quote for
 * @param request - The quote request parameters
 * @returns A promise that resolves to the quote response
 */
export async function getCowOrderbookQuote(
  chainId: SupportedChainId,
  request: CowQuoteRequest
): Promise<CowQuoteResponse> {
  const baseUrl = getApiBaseUrl(chainId)

  // Validate the request - ensure we have the right amount field for the kind
  if (request.kind === "sell") {
    if (!request.sellAmountBeforeFee && !request.sellAmountAfterFee) {
      throw new Error(
        "For sell orders, either sellAmountBeforeFee or sellAmountAfterFee must be provided"
      )
    }
  } else if (request.kind === "buy") {
    if (!request.buyAmountAfterFee) {
      throw new Error("For buy orders, buyAmountAfterFee must be provided")
    }
  }

  return await apiCall<CowQuoteResponse>(baseUrl, "quote", {
    method: "POST",
    body: JSON.stringify(request),
  })
}

/**
 * Post a signed order to the COW Protocol orderbook
 *
 * @param chainId - The chain ID to post the order to
 * @param request - The signed order request parameters
 * @returns A promise that resolves to the order response with orderId
 */
export async function postCowOrder(
  chainId: SupportedChainId,
  request: CowOrderRequest
): Promise<CowOrderResponse> {
  const baseUrl = getApiBaseUrl(chainId)

  // Validate required fields for posting an order
  if (!request.signature) {
    throw new Error("Order signature is required")
  }
  if (!request.from) {
    throw new Error("Order from address is required")
  }

  return await apiCall<CowOrderResponse>(baseUrl, "orders", {
    method: "POST",
    body: JSON.stringify(request),
  })
}
