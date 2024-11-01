import { chains } from "./chains"
import { ChainId, Clearance, ExecutionOptions, Function } from "./types"

type Props = {
  address: `0x${string}`
} & (
  | {
      /** pass a chainId to use query against a dev subgraph */
      chainId: ChainId
    }
  | {
      /** pass your own subgraph endpoint for production use */
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
      }
      unwrapAdapters(where: {selector: "0x8d80ff0a", adapterAddress: "0x93b7fcbc63ed8a3a24b59e1c3e6649d50b7427c0"}) {
        targetAddress
      }
    }
  }
`

type FetchOptions = Omit<RequestInit, "method" | "body">

export const fetchRolesMod = async (
  { address, ...rest }: Props,
  options?: FetchOptions
): Promise<RolesModifier | null> => {
  const endpoint =
    "subgraph" in rest ? rest.subgraph : chains[rest.chainId].subgraph

  const res = await fetch(endpoint, {
    ...options,
    method: "POST",
    headers: {
      ...options?.headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: QUERY,
      variables: { id: address.toLowerCase() },
      operationName: "RolesMod",
    }),
  })
  const { data, error, errors } = await res.json()

  if (error || (errors && errors[0])) {
    throw new Error(error || errors[0])
  }

  if (!data || !data.rolesModifier) {
    return null
  }

  assertNoPagination(data.rolesModifier.roles)
  for (const role of data.rolesModifier.roles) {
    assertNoPagination(role.members)
    assertNoPagination(role.targets)
  }

  return mapGraphQl(data.rolesModifier)
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
  multiSendAddresses: `0x${string}`[]
}

const mapGraphQl = (rolesModifier: any): RolesModifier => ({
  ...rolesModifier,
  roles: rolesModifier.roles.map(mapGraphQlRole),
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

const assertNoPagination = (data: any[]) => {
  if (data.length === 1000) {
    throw new Error("Pagination not supported")
  }
}
