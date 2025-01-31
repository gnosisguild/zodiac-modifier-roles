import { decodeBytes32String, encodeBytes32String } from "ethers"

/**
 * Encodes a human-readable key for addressing roles or allowances to a bytes32 string.
 * Detects if the input is already encoded.
 */
export const encodeKey = (key: string) => {
  if (key.startsWith("0x") && key.length === 66) {
    // already encoded
    return key
  }

  return encodeBytes32String(key)
}

/**
 * Decodes a bytes32 encoded string to a human-readable key for addressing roles or allowances.
 * Detects if the input is already decoded.
 */
export const decodeKey = (key: string) => {
  if (key.startsWith("0x") && key.length === 66) {
    return decodeBytes32String(key)
  }

  try {
    encodeBytes32String(key)
  } catch (e) {
    throw new Error(`Invalid key: ${key}`)
  }

  return key
}
