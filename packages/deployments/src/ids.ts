import { ChainId } from "./types"

export const getRolesModId = (chainId: ChainId, address: `0x${string}`) =>
  `${chainId}:${address.toLowerCase()}`

export const getRoleId = (
  chainId: ChainId,
  address: `0x${string}`,
  roleKey: `0x${string}`
) => `${getRolesModId(chainId, address)}:${roleKey}`
