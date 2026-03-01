import { hexlify, toUtf8Bytes } from "ethers"
import { Condition, Operator, Encoding } from "zodiac-roles-sdk"

/**
 * Scopes a role to only allow signing personal_sign messages whose text
 * starts with the given string.
 *
 * Uses the `signPersonalMessage(bytes)` entrypoint which handles EIP-191
 * wrapping internally. The condition is a single bitmask on the raw
 * message bytes.
 */
export const scopePersonalSign = ({
  startsWith,
}: {
  startsWith: string
}): { selector: `0x${string}`; condition: Condition } => {
  const startsWithHex = hexlify(toUtf8Bytes(startsWith)).slice(2)
  const shift = "0000"
  const mask = "ff".repeat(startsWithHex.length / 2)

  return {
    selector: "0x641e3d2b", // personalSign(bytes)
    condition: {
      paramType: Encoding.AbiEncoded,
      operator: Operator.Matches,
      children: [
        {
          paramType: Encoding.Dynamic,
          operator: Operator.Bitmask,
          compValue: `0x${shift}${mask}${startsWithHex}`
        },
      ],
    },
  }
}
