import { fetchFromSubgraph, FetchOptions } from "./subgraph"
import { ChainId, RolesModifier } from "./types"
import { mapGraphQl as mapGraphQlRole, ROLE_FIELDS } from "./fetchRole"

type Props = {
  address: `0x${string}`
  chainId: ChainId

  /**
   * Specify a block height to fetch a historic state of the Roles mod. Defaults to latest block.
   * @requires A Zodiac OS Enterprise subscription
   **/
  blockNumber?: number
}

const MOD_FIELDS = `
    address
    owner
    avatar
    target 
    roles {
      ${ROLE_FIELDS}
    }
    allowances {
      key
      refill
      maxRefill
      period
      balance
      timestamp
    }
    unwrapAdapters(
      where: {
        selector: "0x8d80ff0a", 
        adapterAddress: "0x93b7fcbc63ed8a3a24b59e1c3e6649d50b7427c0"
      }
    ) {
      targetAddress
    }
`.trim()

const MOD_QUERY = `
query RolesMod($id: String) {
  rolesModifier(id: $id) {
    ${MOD_FIELDS}
  }
}
`

const MOD_AT_BLOCK_QUERY = `
query RolesMod($id: String, $block: Int) {
  rolesModifier(id: $id, block: { number: $block }) {
    ${MOD_FIELDS}
  }
}
`

export const fetchRolesMod = async (
  { address, blockNumber, ...subgraphProps }: Props,
  options?: FetchOptions
): Promise<RolesModifier | null> => {
  const { rolesModifier } = await fetchFromSubgraph(
    {
      query: blockNumber ? MOD_AT_BLOCK_QUERY : MOD_QUERY,
      variables: { id: address.toLowerCase(), block: blockNumber },
      operationName: "RolesMod",
    },
    options
  )

  if (!rolesModifier) {
    return null
  }

  return mapGraphQl(rolesModifier)
}

const mapGraphQl = (rolesModifier: any): RolesModifier => ({
  ...rolesModifier,
  roles: rolesModifier.roles.map(mapGraphQlRole),
  allowances: rolesModifier.allowances.map((allowance: any) => ({
    key: allowance.key,
    refill: BigInt(allowance.refill),
    maxRefill: BigInt(allowance.maxRefill),
    period: BigInt(allowance.period),
    balance: BigInt(allowance.balance),
    timestamp: BigInt(allowance.timestamp),
  })),
  multiSendAddresses: rolesModifier.unwrapAdapters.map(
    (adapter: any) => adapter.targetAddress
  ),
})
