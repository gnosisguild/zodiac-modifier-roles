import SUBGRAPH from "./subgraph"
import {
  Role,
  ChainId,
  Clearance,
  ExecutionOptions,
  Function,
  Target,
} from "./types"

interface Props {
  address: string
  roleKey: string
  chainId: ChainId
}

const QUERY = `
query Role($id: String) {
  role(id: $id) {
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
        executionOptions
        wildcarded
        condition {
          id
          json
        }
      }
    }
    annotations {
      uri
      schema
    }
  }
}
`.trim()

const getRoleId = (address: string, roleKey: string) =>
  `${address.toLowerCase()}-ROLE-${roleKey}`

export const fetchRole = async ({
  address,
  roleKey,
  chainId,
}: Props): Promise<Role> => {
  const res = await fetch(SUBGRAPH[chainId], {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: QUERY,
      variables: { id: getRoleId(address, roleKey) },
      operationName: "Role",
    }),
  })
  const { data, error } = await res.json()
  if (error) {
    throw new Error(error)
  }
  if (!data || !data.role) {
    throw new Error(`Role ${roleKey} not found on ${address}`)
  }

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
