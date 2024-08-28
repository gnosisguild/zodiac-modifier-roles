import { decodeBytes32String, encodeBytes32String } from "ethers"

export const encodeRoleKey = (roleKey: string) => {
  if (roleKey.startsWith("0x") && roleKey.length === 66) {
    // already encoded
    return roleKey
  }

  return encodeBytes32String(roleKey)
}

export const decodeRoleKey = (roleKey: string) => {
  if (roleKey.startsWith("0x") && roleKey.length === 66) {
    return decodeBytes32String(roleKey)
  }

  try {
    encodeBytes32String(roleKey)
  } catch (e) {
    throw new Error(`Invalid role key: ${roleKey}`)
  }

  return roleKey
}
