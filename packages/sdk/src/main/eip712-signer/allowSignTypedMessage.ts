import { TypedData } from "abitype"
import { AbiCoder, keccak256 } from "ethers"
import {
  Condition,
  Encoding,
  Operator,
  SIGN_TYPED_MESSAGE_LIB_ADDRESS,
} from "zodiac-roles-deployments"

import { encodeAbiTypes, toAbiTypes } from "./encode"

/**
 * Returns a permission allowing the role to sign EIP-712 typed messages
 * matching the given domain and message conditions.
 *
 * The returned permission targets `SignTypedMessageLib` under a selector
 * that's deterministically derived from the provided `types`, so different
 * EIP-712 layouts can be scoped under the same target without colliding.
 */
export const allowSignTypedMessage = ({
  domain,
  message,
  types,
}: {
  domain: Condition
  message: Condition
  types: TypedData
}): {
  targetAddress: `0x${string}`
  selector: `0x${string}`
  delegatecall: true
  condition: Condition
} => {
  if (domain.paramType !== Encoding.AbiEncoded) {
    throw new Error("Domain is not an AbiEncoded condition")
  }

  if (message.paramType !== Encoding.AbiEncoded) {
    throw new Error("Message is not an AbiEncoded condition")
  }

  if (!types["EIP712Domain"]) {
    throw new Error("TypedData does not include EIP712Domain")
  }

  const selector = keccak256(encodeAbiTypes({ types })).slice(
    0,
    10
  ) as `0x${string}`

  return {
    targetAddress: SIGN_TYPED_MESSAGE_LIB_ADDRESS,
    selector,
    delegatecall: true,
    condition: {
      paramType: Encoding.AbiEncoded,
      operator: Operator.Matches,
      children: [domain, message, typesCondition(types)],
    },
  }
}

function typesCondition(types: TypedData): Condition {
  const nodes = toAbiTypes({ types })
  const compValue = AbiCoder.defaultAbiCoder().encode(
    ["tuple(uint256,uint8,bytes32)[]"],
    [nodes.map((n) => [n.parent, n.encoding, n.typeHash])]
  )

  return {
    paramType: Encoding.Array,
    operator: Operator.EqualTo,
    compValue: compValue as any,
    children: [
      {
        paramType: Encoding.Tuple,
        operator: Operator.Pass,
        children: [
          {
            paramType: Encoding.Static,
            operator: Operator.Pass,
          },
          {
            paramType: Encoding.Static,
            operator: Operator.Pass,
          },
          {
            paramType: Encoding.Static,
            operator: Operator.Pass,
          },
        ],
      },
    ],
  }
}
