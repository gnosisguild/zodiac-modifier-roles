import { Quote } from "./types"
import { validateAppData } from "./appData"
import { postCowOrder as postCowOrderApi } from "./cowOrderbookApi"

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
    kind: quote.kind,
    partiallyFillable: quote.partiallyFillable,
    sellTokenBalance: quote.sellTokenBalance,
    buyTokenBalance: quote.buyTokenBalance,
    from: quote.from,
    signature: quote.from,
    signingScheme: "presign",
  })
}
