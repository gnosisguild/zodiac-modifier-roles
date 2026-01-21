import {
  OrderBookApi,
  OrderQuoteRequest,
  OrderQuoteResponse,
  OrderCreation,
} from "@cowprotocol/sdk-order-book"
import { SupportedChainId } from "./types"

// Cache OrderBookApi instances per chainId
const apiCache = new Map<SupportedChainId, OrderBookApi>()

function getOrderBookApi(chainId: SupportedChainId): OrderBookApi {
  let api = apiCache.get(chainId)
  if (!api) {
    api = new OrderBookApi({ chainId })
    apiCache.set(chainId, api)
  }
  return api
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
  request: OrderQuoteRequest
): Promise<OrderQuoteResponse> {
  const api = getOrderBookApi(chainId)
  return api.getQuote(request)
}

/**
 * Post a signed order to the COW Protocol orderbook
 *
 * @param chainId - The chain ID to post the order to
 * @param request - The signed order request parameters
 * @returns A promise that resolves to the orderId
 */
export async function postCowOrder(
  chainId: SupportedChainId,
  request: OrderCreation
): Promise<string> {
  const api = getOrderBookApi(chainId)
  return api.sendOrder(request)
}
