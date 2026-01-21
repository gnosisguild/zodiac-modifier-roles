import {
  OrderKind,
  SigningScheme,
  SellTokenSource,
  BuyTokenDestination,
} from "@cowprotocol/sdk-order-book"
import { Quote } from "./types"
import { validateAppData } from "./appData"
import { postCowOrder as postCowOrderApi } from "./cowOrderbookApi"

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

/**
 * Posts a CowSwap order to the Cow order book API.
 * Should be used in conjunction with `signCowOrder`.
 * @returns A promise that resolves to the orderId
 */
export const postCowOrder = async (quote: Quote) => {
  // Validate the appData before posting
  await validateAppData(
    { chainId: quote.chainId, owner: quote.from },
    quote.appData
  )

  // Post the order to the COW Protocol API
  return await postCowOrderApi(quote.chainId, {
    sellToken: quote.sellToken,
    buyToken: quote.buyToken,
    sellAmount: quote.sellAmount,
    buyAmount: quote.buyAmount,
    validTo: quote.validTo,
    appData: quote.appData,
    feeAmount: "0",
    kind: quote.kind === "sell" ? OrderKind.SELL : OrderKind.BUY,
    partiallyFillable: quote.partiallyFillable,
    sellTokenBalance: quote.sellTokenBalance
      ? sellTokenSourceMap[quote.sellTokenBalance]
      : undefined,
    buyTokenBalance: quote.buyTokenBalance
      ? buyTokenDestinationMap[quote.buyTokenBalance]
      : undefined,
    from: quote.from,
    signature: quote.from,
    signingScheme: SigningScheme.PRESIGN,
  })
}
