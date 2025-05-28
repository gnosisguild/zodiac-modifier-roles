import { fetchRolesModConfig } from "zodiac-roles-deployments"
import { makeAppData } from "./appData"
import { getCowOrderbookQuote } from "./cowOrderbookApi"
import type { QuoteRequest } from "./types"

// Re-export types for convenience
export type {
  QuoteRequest,
  SellOrderRequest,
  BuyOrderRequest,
  SupportedChainId,
} from "./types"

/**
 * Gets a quote for a CowSwap order. The result can be used as input for `signCowOrder` and `postCowOrder`.
 */
export const getCowQuote = async (quoteRequest: QuoteRequest) => {
  const rolesModConfig = await fetchRolesModConfig({
    chainId: quoteRequest.chainId,
    address: quoteRequest.rolesModifier,
  })

  if (!rolesModConfig) {
    throw new Error(
      `RolesModifier ${quoteRequest.rolesModifier} not found on subgraph`
    )
  }

  // Calculate validTo if not provided (30 minutes from now)
  const validTo =
    quoteRequest.validTo || Math.floor(Date.now() / 1000) + 30 * 60

  return await getCowOrderbookQuote(quoteRequest.chainId, {
    sellToken: quoteRequest.sellToken,
    buyToken: quoteRequest.buyToken,
    kind: quoteRequest.kind,
    from: rolesModConfig.avatar,
    validTo,
    receiver: quoteRequest.receiver || rolesModConfig.avatar,
    appData: await makeAppData({
      chainId: quoteRequest.chainId,
      owner: rolesModConfig.owner,
    }),
    sellAmountBeforeFee:
      quoteRequest.kind === "sell"
        ? quoteRequest.sellAmountBeforeFee.toString()
        : undefined,
    buyAmountAfterFee:
      quoteRequest.kind === "buy"
        ? quoteRequest.buyAmountAfterFee.toString()
        : undefined,
    partiallyFillable: quoteRequest.partiallyFillable,
    sellTokenBalance: quoteRequest.sellTokenBalance,
    buyTokenBalance: quoteRequest.buyTokenBalance,
    priceQuality: quoteRequest.priceQuality,
    signingScheme: quoteRequest.signingScheme,
  })
}
