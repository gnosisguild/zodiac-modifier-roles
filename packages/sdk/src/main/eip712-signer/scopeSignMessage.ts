import { Condition, Operator, Encoding } from "zodiac-roles-sdk"

export const scopeSignMessage = ({
  message,
}: {
  message: Condition
}): { selector: `0x${string}`; condition: Condition } => {
  return {
    selector: "0x85a5affe", // signMessage(bytes) selector
    condition: {
      paramType: Encoding.AbiEncoded,
      operator: Operator.Matches,
      children: [message],
    },
  }
}
