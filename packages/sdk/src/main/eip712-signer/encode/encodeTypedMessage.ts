import { TypedData } from "abitype"
import { AbiCoder } from "ethers"

import { findPrimaryType, parseType } from "../types"

export function encodeTypedMessage({
  types,
  message,
}: {
  types: TypedData
  message: Record<string, any>
}): `0x${string}` {
  const primaryType = findPrimaryType({ types })
  return AbiCoder.defaultAbiCoder().encode(
    [abiTypes(types, primaryType)],
    [abiValues(types, message, primaryType)]
  ) as `0x${string}`
}

function abiTypes(types: TypedData, type: string): string {
  const { type: baseType, isStruct, isArray, fixedLength } = parseType(type)

  if (isStruct) {
    return `tuple(${types[type]
      .map((field) => abiTypes(types, field.type))
      .join(",")})`
  } else if (isArray && fixedLength) {
    return `tuple(${new Array(fixedLength)
      .fill(abiTypes(types, baseType))
      .join(",")})`
  } else if (isArray && !fixedLength) {
    return `${abiTypes(types, baseType)}[]`
  } else {
    return type
  }
}

function abiValues(types: TypedData, value: any, type: string): any[] {
  const { type: baseType, isStruct, isArray } = parseType(type)

  if (isStruct) {
    return types[type].map((field) =>
      abiValues(types, value[field.name], field.type)
    )
  } else if (isArray) {
    return value.map((child: string) => abiValues(types, child, baseType))
  } else {
    return value
  }
}
