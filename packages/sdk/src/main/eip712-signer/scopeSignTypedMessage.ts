import { TypedData } from "abitype"
import { AbiCoder, Interface, keccak256 } from "ethers"
import { Condition, Operator, Encoding, rolesAbi } from "zodiac-roles-sdk"

import { encodeAbiTypes, toAbiTypes } from "./encode"

export const scopeSignTypedMessage = ({
  domain,
  message,
  types,
}: {
  domain: Condition
  message: Condition
  types: TypedData
}): { selector: `0x${string}`; condition: Condition } => {
  if (domain.paramType !== Encoding.AbiEncoded) {
    throw new Error("Domain is not and AbiEncoded condition")
  }

  if (message.paramType !== Encoding.AbiEncoded) {
    throw new Error("Message is not and AbiEncoded condition")
  }

  if (!types["EIP712Domain"]) {
    throw new Error("TypedData does not include EIP712Domain")
  }

  const selector = keccak256(encodeAbiTypes({ types })).slice(0, 10)
  return {
    selector: selector as `0x${string}`,
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

export const iface = Interface.from(rolesAbi)
