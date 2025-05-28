import { TransactionRequest } from "ethers"
import { Quote } from "./types"
import { encodeSignOrderWithRole } from "./encodeSignOrder"

/**
 * Encodes the call to the Roles Modifier to make the avatar sign the given CowSwap order.
 * Should be used in conjunction with `postCowOrder`.
 */
export const signCowOrder = (quote: Quote) => {
  return {
    to: quote.rolesModifier,
    data: encodeSignOrderWithRole(quote),
    value: 0 as const,
    chainId: quote.chainId,
  } satisfies TransactionRequest
}
