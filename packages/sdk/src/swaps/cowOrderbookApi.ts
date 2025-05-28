import { SupportedChainId } from "./types"
import type { CowQuoteRequest, CowQuoteResponse, CowApiError } from "./types"

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
