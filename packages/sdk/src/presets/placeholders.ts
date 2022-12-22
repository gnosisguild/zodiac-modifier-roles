import { BigNumberish, BytesLike } from "ethers/lib/ethers"

import { Placeholder } from "./types"

// legacy placeholder format
export const AVATAR_ADDRESS_PLACEHOLDER = Symbol("AVATAR_ADDRESS_PLACEHOLDER")

export const OMNI_BRIDGE_DATA_PLACEHOLDER = Symbol(
  "OMNI_BRIDGE_DATA_PLACEHOLDER"
)

export const OMNI_BRIDGE_RECEIVER_PLACEHOLDER = Symbol(
  "OMNI_BRIDGE_RECEIVER_PLACEHOLDER"
)

// new placeholder format
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

// | BytesLike | string | boolean =>
//   typeof value === "object" &&
//   (value.string || value.byteslike || value.bignumberis)
