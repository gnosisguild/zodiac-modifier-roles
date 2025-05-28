import { chains } from "./chains"
import { ChainId } from "./types"

export const getRolesModId = (chainId: ChainId, address: `0x${string}`) =>
  `${chains[chainId].prefix}:rolesmod:${address.toLowerCase()}`

export const getRoleId = (
  chainId: ChainId,
  address: `0x${string}`,
  roleKey: `0x${string}`
) => `${chains[chainId].prefix}:role:${address.toLowerCase()}:${roleKey}`
