import { ChainId } from "zodiac-roles-sdk"

import { getRolesModId } from "./ids"
import { fetchFromSubgraph, FetchOptions } from "./subgraph"

interface Props {
  chainId: ChainId
  address: `0x${string}`
}

const MOD_CONFIG_QUERY = `
query RolesModConfig($id: ID!) {
  rolesModifier(id: $id) {
    avatar
    owner
    target
  }
}
`

interface RoleModConfig {
  avatar: `0x${string}`
  owner: `0x${string}`
  target: `0x${string}`
}

export const fetchRolesModConfig = async (
  { chainId, address }: Props,
  options?: FetchOptions
): Promise<RoleModConfig | null> => {
  const { rolesModifier } = await fetchFromSubgraph(
    {
      query: MOD_CONFIG_QUERY,
      variables: { id: getRolesModId(chainId, address) },
      operationName: "RolesModConfig",
    },
    options
  )

  if (!rolesModifier) {
    return null
  }

  return rolesModifier
}
