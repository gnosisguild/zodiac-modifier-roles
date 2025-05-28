import { Quote } from "./types"
import { validateAppData } from "./appData"
import { postCowOrder as postCowOrderApi } from "./cowOrderbookApi"

/**
 * Posts a CowSwap order to the Cow order book API.
 * Should be used in conjunction with `signCowOrder`.
 */
export const postCowOrder = async (
  quote: Quote,
  signature: string,
  signingScheme: "eip712" | "ethsign" | "eip1271" | "presign" = "eip712"
) => {
  // Validate the appData before posting
  await validateAppData(
    { chainId: quote.chainId, owner: quote.from },
    quote.appData
  )

  // Post the order to the COW Protocol API
  const response = await postCowOrderApi(quote.chainId, {
    sellToken: quote.sellToken,
    buyToken: quote.buyToken,
    sellAmount: quote.sellAmount,
    buyAmount: quote.buyAmount,
    validTo: quote.validTo,
    appData: quote.appData,
    feeAmount: quote.networkCostsAmount, // COW Protocol uses feeAmount for network costs
    kind: quote.kind,
    partiallyFillable: quote.partiallyFillable,
    sellTokenBalance: quote.sellTokenBalance,
    buyTokenBalance: quote.buyTokenBalance,
    from: quote.from,
    signature,
    signingScheme,
  })

  return response.orderId
}
