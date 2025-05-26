import { Order } from "@cowprotocol/cow-sdk"

import { OrderBookApi } from "@cowprotocol/cow-sdk"

import { SupportedChainId } from "@cowprotocol/cow-sdk"

const orderBookApi = new OrderBookApi({
  chainId: SupportedChainId.GNOSIS_CHAIN,
})

export const postCowOrder = async ({
  order,
  noFee = false,
}: {
  order: Order
  noFee?: boolean
}) => {
  const { quote } = await orderBookApi.getQuote(quoteRequest)
  quote
}
