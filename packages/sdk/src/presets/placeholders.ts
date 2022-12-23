import { BigNumberish, BytesLike } from "ethers/lib/ethers"

import { Placeholder, PlaceholderValues } from "./types"

export const AVATAR_ADDRESS = {
  string: Symbol("AVATAR_ADDRESS"),
}

export const OMNI_BRIDGE_DATA = {
  byteslike: Symbol("OMNI_BRIDGE_DATA"),
}

export const OMNI_BRIDGE_RECEIVER = {
  string: Symbol("OMNI_BRIDGE_RECEIVER"),
}

const isBigNumberishPlaceholder = (
  value: any
): value is Placeholder<BigNumberish> =>
  typeof value === "object" && typeof value.bignumberish === "symbol"
const isBytesLikePlaceholder = (value: any): value is Placeholder<BytesLike> =>
  typeof value === "object" && typeof value.byteslike === "symbol"
const isStringPlaceholder = (value: any): value is Placeholder<string> =>
  typeof value === "object" && typeof value.string === "symbol"
const isBooleanPlaceholder = (value: any): value is Placeholder<boolean> =>
  typeof value === "object" && typeof value.boolean === "symbol"

export const isPlaceholder = (
  value: any
): value is Placeholder<BigNumberish | BytesLike | string | boolean> =>
  isBigNumberishPlaceholder(value) ||
  isBytesLikePlaceholder(value) ||
  isStringPlaceholder(value) ||
  isBooleanPlaceholder(value)

export const resolvePlaceholderValue = (
  value: any,
  placeholderValues: PlaceholderValues
): string => {
  let key: symbol
  if (isBigNumberishPlaceholder(value)) {
    key = value.bignumberish
  } else if (isBytesLikePlaceholder(value)) {
    key = value.byteslike
  } else if (isStringPlaceholder(value)) {
    key = value.string
  } else if (isBooleanPlaceholder(value)) {
    key = value.boolean
  } else {
    // not a placeholder bit a regular value, just return it
    return value
  }

  const result = placeholderValues[key]
  if (!result) {
    throw new Error(`Placeholder value for ${String(key)} not found`)
  }

  return result
}
