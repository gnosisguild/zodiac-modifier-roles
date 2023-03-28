import { ParamType } from "ethers/lib/utils"

import { Operator, ParameterType } from "../../types"

import { mapScoping } from "./matches"
import { ConditionFunction, Scoping } from "./types"

// export type BranchCondition<T> = (
//   branches: Scoping<T>[]
// ) => ConditionFunction<T>

export const or =
  <T>(...branches: Scoping<T>[]): ConditionFunction<T> =>
  (abiType: ParamType) => ({
    paramType: ParameterType.None,
    operator: Operator.Or,
    children: branches.map((branch) => mapScoping(branch, abiType)),
  })
