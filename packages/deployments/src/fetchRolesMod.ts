import { chains } from "./chains"
import { ChainId, Clearance, ExecutionOptions, Function } from "./types"

interface Props {
  address: `0x${string}`
  chainId: ChainId
}

const QUERY = `
  query RolesMod($id: String) {
    rolesModifier(id: $id) {
      address
      owner
      avatar
      target 
      roles {
        key
        members {
          member {
            address
          }
        }
        targets {
          address
          clearance
          executionOptions
          functions {
            selector
            wildcarded
            executionOptions
          }
        }
      }
    }
  }
`

type FetchOptions = Omit<RequestInit, "method" | "body">

export const fetchRolesMod = async (
  { address, chainId }: Props,
  options?: FetchOptions
): Promise<RolesModifier | null> => {
  const res = await fetch(chains[chainId].subgraph, {
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
}

const mapGraphQl = (rolesModifier: any): RolesModifier => ({
  ...rolesModifier,
  roles: rolesModifier.roles.map(mapGraphQlRole),
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
