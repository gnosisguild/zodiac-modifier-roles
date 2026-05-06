import { hexlify, toUtf8Bytes } from "ethers"
import {
  Condition,
  Encoding,
  Operator,
  SIGN_TYPED_MESSAGE_LIB_ADDRESS,
} from "zodiac-roles-deployments"

/**
 * Returns a permission allowing the role to sign personal_sign messages
 * whose text starts with the given string.
 *
 * Uses the `personalSign(bytes)` entrypoint of `SignTypedMessageLib` which
 * handles EIP-191 wrapping internally. The condition is a single bitmask
 * on the raw message bytes.
 */
export const allowPersonalSign = ({
  startsWith,
}: {
  startsWith: string
}): {
  targetAddress: `0x${string}`
  selector: `0x${string}`
  delegatecall: true
  condition: Condition
} => {
  if (!startsWith) {
    throw new Error("startsWith must not be empty")
  }

  const startsWithHex = hexlify(toUtf8Bytes(startsWith)).slice(2)
  const shift = "0000"
  const mask = "ff".repeat(startsWithHex.length / 2)
  const compValue = `0x${shift}${mask}${startsWithHex}` as `0x${string}`

  return {
    targetAddress: SIGN_TYPED_MESSAGE_LIB_ADDRESS,
    selector: "0x641e3d2b", // personalSign(bytes)
    delegatecall: true,
    condition: {
      paramType: Encoding.AbiEncoded,
      operator: Operator.Matches,
      children: [
        {
          paramType: Encoding.Dynamic,
          operator: Operator.Bitmask,
          compValue,
        },
      ],
    },
  }
}
