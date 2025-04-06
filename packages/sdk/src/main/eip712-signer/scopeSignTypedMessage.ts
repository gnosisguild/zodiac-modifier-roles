import { TypedData } from "abitype"
import { AbiCoder, Interface, keccak256 } from "ethers"
import { Condition, Operator, AbiType, abi } from "zodiac-roles-sdk"

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
  if (domain.paramType !== AbiType.AbiEncoded) {
    throw new Error("Domain is not and AbiEncoded condition")
  }

  if (message.paramType !== AbiType.AbiEncoded) {
    throw new Error("Message is not and AbiEncoded condition")
  }

  if (!types["EIP712Domain"]) {
    throw new Error("TypedData does not include EIP712Domain")
  }

  const selector = keccak256(encodeAbiTypes({ types })).slice(0, 10)
  return {
    selector: selector as `0x${string}`,
    condition: {
      paramType: AbiType.Calldata,
      operator: Operator.Matches,
      children: [domain, message, typesCondition(types)],
    },
  }
}

function typesCondition(types: TypedData): Condition {
  const { typeTree, typeHashes } = toAbiTypes({ types })
  const compValue = AbiCoder.defaultAbiCoder().encode(
    ["tuple(tuple(uint8,uint256[])[], bytes32[])"],
    [[typeTree.map((p) => [p._type, p.fields]), typeHashes]]
  )

  const left: Condition = {
    paramType: AbiType.Array,
    operator: Operator.Pass,
    compValue: "0x",
    children: [
      {
        paramType: AbiType.Tuple,
        operator: Operator.Pass,
        children: [
          {
            paramType: AbiType.Static,
            operator: Operator.Pass,
          },
          {
            paramType: AbiType.Array,
            operator: Operator.Pass,
            children: [
              {
                paramType: AbiType.Static,
                operator: Operator.Pass,
              },
            ],
          },
        ],
      },
    ],
  }

  const right: Condition = {
    paramType: AbiType.Array,
    operator: Operator.Pass,
    compValue: "0x",
    children: [
      {
        paramType: AbiType.Static,
        operator: Operator.Pass,
        compValue: "0x",
      },
    ],
  }
  return {
    paramType: AbiType.Tuple,
    operator: Operator.EqualTo,
    compValue: compValue as any,
    children: [left, right],
  }
}

export const iface = Interface.from(abi)
