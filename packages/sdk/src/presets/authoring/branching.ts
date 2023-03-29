import { ParamType } from "ethers/lib/utils"

import { Operator, ParameterType } from "../../types"

import { mapScoping } from "./matches"
import { ConditionFunction, Scoping } from "./types"

type BranchCondition<S, T> = (
  ...branches: [...Scoping<S>[]]
) => ConditionFunction<S extends T ? T : S>

export const or =
  <S, T>(
    ...branches: [...Scoping<S>[]]
  ): ConditionFunction<S extends T ? T : S> =>
  (abiType: ParamType) => ({
    paramType: ParameterType.None,
    operator: Operator.Or,
    children: branches.map((branch) => mapScoping(branch, abiType)),
  })
