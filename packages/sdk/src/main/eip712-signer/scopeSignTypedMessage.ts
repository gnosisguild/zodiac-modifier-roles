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
  const { layout, typeHashes } = toAbiTypes({ types })
  const compValue = AbiCoder.defaultAbiCoder().encode(
    ["tuple(tuple(uint256,uint8)[], bytes32[])"],
    [[layout.map((p) => [p.parent, p.encoding]), typeHashes]]
  )

  const left: Condition = {
    paramType: Encoding.Array,
    operator: Operator.Pass,
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
        ],
      },
    ],
  }

  const right: Condition = {
    paramType: Encoding.Array,
    operator: Operator.Pass,
    children: [
      {
        paramType: Encoding.Static,
        operator: Operator.Pass,
      },
    ],
  }
  return {
    paramType: Encoding.Tuple,
    operator: Operator.EqualTo,
    compValue: compValue as any,
    children: [left, right],
  }
}

export const iface = Interface.from(rolesAbi)
