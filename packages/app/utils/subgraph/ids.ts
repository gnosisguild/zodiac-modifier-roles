import { ChainId, chains } from "zodiac-roles-sdk"

export const getRolesModId = (chainId: ChainId, address: `0x${string}`) =>
  `${chains[chainId].prefix}:${address.toLowerCase()}`

export const getRoleId = (
  chainId: ChainId,
  address: `0x${string}`,
  roleKey: `0x${string}`
) => `${chains[chainId].prefix}:${address.toLowerCase()}:${roleKey}`
