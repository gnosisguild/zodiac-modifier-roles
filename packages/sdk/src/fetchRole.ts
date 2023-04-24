import SUBGRAPH from "./subgraph"
import {
  Role,
  ChainId,
  Clearance,
  ExecutionOptions,
  Function,
  Target,
  ParameterType,
  Operator,
  Condition,
} from "./types"

interface Props {
  address: string
  roleKey: string
  network: ChainId
}

const QUERY = `
  fragment ConditionFragment on Condition {
    paramType
    operator
    compValue
    children {
      ...ConditionFragment
    }
  }

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
            ...ConditionFragment
          }
        }
      }
    }
  }
`

const getRoleId = (address: string, roleKey: string) =>
  `${address.toLowerCase()}-ROLE-${roleKey}`

export const fetchRole = async ({
  address,
  roleKey,
  network,
}: Props): Promise<Role> => {
  const res = await fetch(SUBGRAPH[network], {
    method: "POST",
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
          condition: mapGraphQlCondition(func.condition),
        })
      ),
    })
  ),
})

const mapGraphQlCondition = (condition: any): Condition => {
  return {
    paramType: ParameterType[condition.paramType as keyof typeof ParameterType],
    operator: Operator[condition.operator as keyof typeof Operator],
    compValue: condition.compValue,
    children: condition.children?.map(mapGraphQlCondition),
  }
}
