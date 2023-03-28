import { ParamType } from "ethers/lib/utils"

import { ParameterType, Operator } from "../types"

import { mapScoping } from "./mapScoping"
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
