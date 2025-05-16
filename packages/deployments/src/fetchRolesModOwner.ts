import { getRolesModId } from "./ids"
import { fetchFromSubgraph, FetchOptions } from "./subgraph"
import {
  Allowance,
  ChainId,
  Clearance,
  ExecutionOptions,
  Function,
  Role,
  Target,
} from "./types"

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

export const fetchRolesMod = async (
  { chainId, address }: Props,
  options?: FetchOptions
): Promise<RolesModifier | null> => {
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

  return mapGraphQl(rolesModifier)
}

export interface RolesModifier {
  address: `0x${string}`
  owner: `0x${string}`
  avatar: `0x${string}`
  target: `0x${string}`
  roles: Role[]
  allowances: Allowance[]
  multiSendAddresses: `0x${string}`[]
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

const mapGraphQlRole = (role: any): Role => ({
  ...role,
  members: role.members.map((assignment: any) => assignment.member.address),
  targets: role.targets.map(
    (target: any): Target => ({
      address: target.address,
      clearance: Clearance[target.clearance as keyof typeof Clearance],
      executionOptions:
        ExecutionOptions[
          target.executionOptions as keyof typeof ExecutionOptions
        ],
      functions: target.functions.map(
        (func: any): Function => ({
          selector: func.selector,
          executionOptions:
            ExecutionOptions[
              func.executionOptions as keyof typeof ExecutionOptions
            ],
          wildcarded: func.wildcarded,
          condition: func.condition && JSON.parse(func.condition.json),
        })
      ),
    })
  ),
})
