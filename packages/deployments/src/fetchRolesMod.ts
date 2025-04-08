import { assertNoPagination, fetchFromSubgraph, FetchOptions } from "./subgraph"
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
  address: `0x${string}`
  /** Specify a block height to fetch a historic state of the Roles mod. Defaults to latest block. */
  blockNumber?: number
} & (
  | {
      /** pass a chainId to use query against the official subgraph deployment */
      chainId: ChainId
      /** pass your own API key from The Graph for production use */
      theGraphApiKey?: string
    }
  | {
      /** pass your own subgraph endpoint */
      subgraph: string
    }
)

const MOD_FIELDS = `
    address
    owner
    avatar
    target 
    roles(first: 1000) {
      key
      members(first: 1000) {
        member {
          address
        }
      }
      targets(first: 1000) {
        address
        clearance
        executionOptions
        functions(first: 1000) {
          selector
          executionOptions
          wildcarded
          condition {
            id
            json
          }
        }
      }
      annotations(first: 1000) {
        uri
        schema
      }
      lastUpdate
    }
    allowances(first: 1000) {
      key
      refill
      maxRefill
      period
      balance
      timestamp
    }
    unwrapAdapters(
      first: 1000,
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
    subgraphProps,
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

  assertNoPagination(rolesModifier.roles)
  for (const role of rolesModifier.roles) {
    assertNoPagination(role.members)
    assertNoPagination(role.targets)
  }

  assertNoPagination(rolesModifier.allowances)
  assertNoPagination(rolesModifier.unwrapAdapters)

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
