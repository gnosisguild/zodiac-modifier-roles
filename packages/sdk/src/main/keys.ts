import { decodeBytes32String, encodeBytes32String } from "ethers"

const ENCODED_LENGTH = 66

/**
 * Encodes a human-readable key for addressing roles or allowances to a bytes32 string.
 * Detects if the input is already encoded.
 */
export const encodeKey = (key: string) => {
  if (isEncoded(key)) {
    // already encoded
    return key as `0x${string}`
  }

  assertEncodable(key)

  return encodeBytes32String(key) as `0x${string}`
}

/**
 * Decodes a bytes32 encoded string to a human-readable key for addressing roles or allowances.
 * Detects if the input is already decoded.
 */
export const decodeKey = (key: string) => {
  if (isEncoded(key)) {
    return decodeBytes32String(key)
  }

  assertEncodable(key)

  return key
}

const isEncoded = (key: string) =>
  key.startsWith("0x") && key.length === ENCODED_LENGTH

/**
 * A key is either an encoded bytes32 value or a label that fits into one.
 *
 * A `0x` prefix that is not exactly 32 bytes is rejected rather than packed as
 * the literal characters it spells: it is almost always a malformed encoded
 * key, and silently turning it into a different one produces a role or
 * allowance reference that resolves to nothing on chain.
 */
function assertEncodable(key: string): void {
  if (key.startsWith("0x")) {
    throw new Error(
      `Invalid key: "${key}" looks like an encoded key but is ${(key.length - 2) / 2} bytes, not 32`
    )
  }

  try {
    encodeBytes32String(key)
  } catch (e) {
    throw new Error(
      `Invalid key: "${key}" does not fit into bytes32, which holds at most 31 bytes`
    )
  }
}
