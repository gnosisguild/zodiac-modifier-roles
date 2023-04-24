import { BytesLike } from "ethers"

/**
 * Encodes a human readable name to a bytes32 key for identifying roles or allowances.
 * Throws if the given name contains characters out of the allowed charset (`0-9`, `a-z`, `_`) or if it is too long.
 */
export const encodeKey = (humanReadableName: string) => {}

/**
 * Decodes a bytes32 value that has been encoded using `encodeKey` to a human readable name.
 */
export const decodeKey = (key: BytesLike) => {}
