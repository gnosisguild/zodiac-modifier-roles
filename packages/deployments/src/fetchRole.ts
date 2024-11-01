import { chains } from "./chains"
import {
  ChainId,
  Role,
  Clearance,
  ExecutionOptions,
  Function,
  Target,
} from "./types"

type Props = {
  address: `0x${string}`
  roleKey: `0x${string}`
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
query Role($id: String) {
  role(id: $id) {
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
  }
}
`.trim()

const getRoleId = (address: `0x${string}`, roleKey: `0x${string}`) =>
  `${address.toLowerCase()}-ROLE-${roleKey}`

type FetchOptions = Omit<RequestInit, "method" | "body">

export const fetchRole = async (
  { address, roleKey, ...rest }: Props,
  options?: FetchOptions
): Promise<Role | null> => {
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
      variables: { id: getRoleId(address, roleKey) },
      operationName: "Role",
    }),
  })
  const { data, error, errors } = await res.json()

  if (error || (errors && errors[0])) {
    throw new Error(error || errors[0])
  }

  if (!data || !data.role) {
    return null
  }

  assertNoPagination(data.role.members)
  assertNoPagination(data.role.targets)
  assertNoPagination(data.role.annotations)

  return mapGraphQl(data.role)
}

const mapGraphQl = (role: any): Role => ({
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

const assertNoPagination = (data: any[]) => {
  if (data.length === 1000) {
    throw new Error("Pagination not supported")
  }
}
