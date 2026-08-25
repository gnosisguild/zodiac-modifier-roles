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
 * Anything that is not already encoded is a label, including one that happens
 * to start with `0x`. Every key goes through here, so a label is packed the
 * same way on the side that sets an allowance and on the side that references
 * it — the two agree whatever the label looks like.
 */
function assertEncodable(key: string): void {
  try {
    encodeBytes32String(key)
  } catch (e) {
    throw new Error(
      `Invalid key: "${key}" does not fit into bytes32, which holds at most 31 bytes`
    )
  }
}
