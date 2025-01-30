import { chains } from "./chains"
import { assertNoPagination, fetchFromSubgraph, FetchOptions } from "./subgraph"
import {
  Allowance,
  ChainId,
  Clearance,
  ExecutionOptions,
  Function,
} from "./types"

type Props = {
  address: `0x${string}`
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

const QUERY = `
  query RolesMod($id: String) {
    rolesModifier(id: $id) {
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
            wildcarded
            executionOptions
          }
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
    }
  }
`

export const fetchRolesMod = async (
  { address, ...subgraphProps }: Props,
  options?: FetchOptions
): Promise<RolesModifier | null> => {
  const { rolesModifier } = await fetchFromSubgraph(
    subgraphProps,
    {
      query: QUERY,
      variables: { id: address.toLowerCase() },
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
    assertNoPagination(role.allowances)
    assertNoPagination(role.unwrapAdapters)
  }

  return mapGraphQl(rolesModifier)
}

interface TargetSummary {
  address: `0x${string}`
  clearance: Clearance
  executionOptions: ExecutionOptions
  functions: {
    selector: `0x${string}`
    wildcarded: boolean
    executionOptions: ExecutionOptions
  }[]
}

export interface RoleSummary {
  key: `0x${string}`
  members: `0x${string}`[]
  targets: TargetSummary[]
}

export interface RolesModifier {
  address: `0x${string}`
  owner: `0x${string}`
  avatar: `0x${string}`
  target: `0x${string}`
  roles: RoleSummary[]
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

const mapGraphQlRole = (role: any): RoleSummary => ({
  key: role.key,
  members: role.members.map((assignment: any) => assignment.member.address),
  targets: role.targets
    .filter(
      (t: any) =>
        t.clearance !== "None" &&
        !(t.clearance === "Function" && t.functions.length === 0)
    )
    .map(
      (target: any): TargetSummary => ({
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
          })
        ),
      })
    ),
})
