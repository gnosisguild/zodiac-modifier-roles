import { formatBytes32String, parseBytes32String } from "ethers/lib/utils"

export const encodeRoleKey = (roleKey: string) => {
  if (roleKey.startsWith("0x") && roleKey.length === 66) {
    // already encoded
    return roleKey
  }

  return formatBytes32String(roleKey)
}

export const decodeRoleKey = (roleKey: string) => {
  if (roleKey.startsWith("0x") && roleKey.length === 66) {
    return parseBytes32String(roleKey)
  }

  try {
    formatBytes32String(roleKey)
  } catch (e) {
    throw new Error(`Invalid role key: ${roleKey}`)
  }

  return roleKey
}
