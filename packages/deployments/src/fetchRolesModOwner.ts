import { getRolesModId } from "./ids"
import { fetchFromSubgraph, FetchOptions } from "./subgraph"
import { ChainId } from "./types"

type Props = {
  chainId: ChainId
  address: `0x${string}`
}

const MOD_OWNER_QUERY = `
query RolesModOwner($id: String) {
  rolesModifier(id: $id) {
    owner
  }
}
`

export const fetchRolesModOwner = async (
  { chainId, address }: Props,
  options?: FetchOptions
): Promise<`0x${string}` | null> => {
  const { rolesModifier } = await fetchFromSubgraph(
    {
      query: MOD_OWNER_QUERY,
      variables: { id: getRolesModId(chainId, address) },
      operationName: "RolesModOwner",
    },
    options
  )

  if (!rolesModifier) {
    return null
  }

  return rolesModifier.owner
}
