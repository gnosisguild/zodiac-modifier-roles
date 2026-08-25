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
    return unpack(key)
  }

  assertEncodable(key)

  return key
}

/**
 * A key counts as encoded only if it is genuinely 32 bytes of hex. Length alone
 * used to be enough, which let a malformed string of the right shape —
 * `"0x" + "z".repeat(64)` — pass straight through `encodeKey` and reach the
 * chain as a key nothing was ever set under. Anything else is a label, and is
 * packed as one.
 */
const isEncoded = (key: string) =>
  key.length === ENCODED_LENGTH && /^0x[0-9a-fA-F]{64}$/.test(key)

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

/**
 * Not every bytes32 key holds a packed label. A role key can be set to a hash,
 * or to any other 32 bytes, and those have no label to recover — ethers reports
 * that as `invalid bytes32 string - no null terminator`, which says nothing
 * about keys and does not name the one that failed.
 */
function unpack(key: string): string {
  try {
    return decodeBytes32String(key)
  } catch (e) {
    throw new Error(
      `Invalid key: "${key}" is not a packed label, so it has no readable form`
    )
  }
}
