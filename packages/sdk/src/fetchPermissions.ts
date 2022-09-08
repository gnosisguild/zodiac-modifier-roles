import fetch from "node-fetch"

import SUBGRAPH from "./subgraph"
import {
  RolePermissions,
  NetworkId,
  Clearance,
  ExecutionOptions,
  Function,
  Target,
  ParameterType,
  Parameter,
  Comparison,
} from "./types"

interface Props {
  address: string
  roleId: number
  network: NetworkId
}

const QUERY = `query RolePermissions($id: String) {
  role(id: $id) {
    targets {
      address
      clearance
      executionOptions
      functions {
        sighash
        executionOptions
        wildcarded
        parameters {
          index
          type
          comparison
          comparisonValue
        }
      }
    }
  }
}`

const fetchPermissions = async ({
  address,
  roleId,
  network,
}: Props): Promise<RolePermissions> => {
  const globalRoleId = `${address.toLowerCase()}-ROLE-${roleId}.0`
  const res = await fetch(SUBGRAPH[network], {
    method: "POST",
    body: JSON.stringify({
      query: QUERY,
      variables: { id: globalRoleId },
      operationName: "RolePermissions",
    }),
  })
  const { data, error } = await res.json()
  if (error) {
    throw new Error(error)
  }
  if (!data || !data.role) {
    throw new Error(`Role #${roleId} not found`)
  }

  return mapGraphQl(data.role)
}

export default fetchPermissions

interface GraphQlParameter {
  comparison: "EqualTo" | "GreaterThan" | "LessThan" | "OneOf"
  comparisonValue: string[]
  index: number
  type: "Static" | "Dynamic" | "Dynamic32"
}
interface GraphQlFunction {
  executionOptions: "None" | "Send" | "DelegateCall" | "Both"
  parameters: GraphQlParameter[]
  sighash: string
  wildcarded: boolean
}
interface GraphQlTarget {
  address: string
  clearance: "Function" | "Target" | "None"
  executionOptions: "None" | "Send" | "DelegateCall" | "Both"
  functions: GraphQlFunction[]
}

const mapGraphQl = (role: { targets: GraphQlTarget[] }): RolePermissions => ({
  targets: role.targets.map(
    (target): Target => ({
      address: target.address,
      clearance: CLEARANCE_MAPPING[target.clearance],
      executionOptions: EXECUTION_OPTIONS_MAPPING[target.executionOptions],
      functions: target.functions.map(
        (func): Function => ({
          sighash: func.sighash,
          executionOptions: EXECUTION_OPTIONS_MAPPING[func.executionOptions],
          wildcarded: func.wildcarded,
          parameters: func.parameters.map(
            (param): Parameter => ({
              index: param.index,
              type: PARAMETER_TYPE_MAPPING[param.type],
              comparison: COMPARISON[param.comparison],
              comparisonValue: param.comparisonValue,
            })
          ),
        })
      ),
    })
  ),
})

const CLEARANCE_MAPPING = {
  None: Clearance.None,
  Target: Clearance.Target,
  Function: Clearance.Function,
}

const EXECUTION_OPTIONS_MAPPING = {
  None: ExecutionOptions.None,
  Send: ExecutionOptions.Send,
  DelegateCall: ExecutionOptions.DelegateCall,
  Both: ExecutionOptions.Both,
}

const PARAMETER_TYPE_MAPPING = {
  Static: ParameterType.Static,
  Dynamic: ParameterType.Dynamic,
  Dynamic32: ParameterType.Dynamic32,
}

const COMPARISON = {
  EqualTo: Comparison.EqualTo,
  GreaterThan: Comparison.GreaterThan,
  LessThan: Comparison.LessThan,
  OneOf: Comparison.OneOf,
}
