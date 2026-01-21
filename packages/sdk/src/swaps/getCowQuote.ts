import {
  OrderQuoteSideKindSell,
  OrderQuoteSideKindBuy,
  SigningScheme,
  SellTokenSource,
  BuyTokenDestination,
  PriceQuality,
  OrderQuoteRequest,
} from "@cowprotocol/sdk-order-book"
import { fetchRolesModConfig } from "zodiac-roles-deployments"
import { makeAppData } from "./appData"
import { getCowOrderbookQuote } from "./cowOrderbookApi"
import type { AdvancedOptions, Quote, QuoteRequest } from "./types"

// Mapping helpers for converting string options to SDK enums
const sellTokenSourceMap: Record<string, SellTokenSource> = {
  erc20: SellTokenSource.ERC20,
  internal: SellTokenSource.INTERNAL,
  external: SellTokenSource.EXTERNAL,
}

const buyTokenDestinationMap: Record<string, BuyTokenDestination> = {
  erc20: BuyTokenDestination.ERC20,
  internal: BuyTokenDestination.INTERNAL,
}

const priceQualityMap: Record<string, PriceQuality> = {
  fast: PriceQuality.FAST,
  optimal: PriceQuality.OPTIMAL,
}

/**
 * Gets a quote for a CowSwap order. The result can be used as input for `signCowOrder` and `postCowOrder`.
 */
export const getCowQuote = async (
  quoteRequest: QuoteRequest,
  advancedOptions: AdvancedOptions = {}
): Promise<Quote> => {
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

  const appData = await makeAppData(
    {
      chainId: quoteRequest.chainId,
      owner: rolesModConfig.owner,
    },
    advancedOptions
  )

  const quoteRequestParams = {
    sellToken: quoteRequest.sellToken,
    buyToken: quoteRequest.buyToken,
    from: rolesModConfig.avatar,
    validTo,
    receiver: quoteRequest.receiver || rolesModConfig.avatar,
    appData,
    sellTokenBalance: quoteRequest.sellTokenBalance
      ? sellTokenSourceMap[quoteRequest.sellTokenBalance]
      : undefined,
    buyTokenBalance: quoteRequest.buyTokenBalance
      ? buyTokenDestinationMap[quoteRequest.buyTokenBalance]
      : undefined,
    priceQuality: quoteRequest.priceQuality
      ? priceQualityMap[quoteRequest.priceQuality]
      : undefined,
    signingScheme: SigningScheme.PRESIGN,
    ...(quoteRequest.kind === "sell"
      ? {
          kind: OrderQuoteSideKindSell.SELL,
          sellAmountBeforeFee: quoteRequest.sellAmountBeforeFee.toString(),
        }
      : {
          kind: OrderQuoteSideKindBuy.BUY,
          buyAmountAfterFee: quoteRequest.buyAmountAfterFee.toString(),
        }),
  } as OrderQuoteRequest

  const { quote } = await getCowOrderbookQuote(
    quoteRequest.chainId,
    quoteRequestParams
  )

  // it's confusing: The quote's feeAmount is something different than the feeAmount of the order (which should be generally 0)
  const networkCostsAmount = quote.feeAmount

  return {
    sellToken: quote.sellToken as `0x${string}`,
    buyToken: quote.buyToken as `0x${string}`,
    receiver: (quote.receiver ?? rolesModConfig.avatar) as `0x${string}`,
    sellAmount: quote.sellAmount,
    buyAmount: quote.buyAmount,
    validTo: quote.validTo,
    appData: quote.appData,
    appDataHash: quote.appData,
    kind: quote.kind.toLowerCase() as "sell" | "buy",
    partiallyFillable: quote.partiallyFillable,
    sellTokenBalance: (quote.sellTokenBalance?.toLowerCase() ??
      "erc20") as "erc20" | "external" | "internal",
    buyTokenBalance: (quote.buyTokenBalance?.toLowerCase() ??
      "erc20") as "erc20" | "internal",
    networkCostsAmount,
    chainId: quoteRequest.chainId,
    from: rolesModConfig.avatar as `0x${string}`,
    rolesModifier: quoteRequest.rolesModifier,
    roleKey: quoteRequest.roleKey,
  }
}
