import { ParamType } from "ethers/lib/utils"

import { Operator, ParameterType } from "../../../types"

import { mapScoping } from "./matches"
import { ConditionFunction, Scoping } from "./types"

type ScopingBranches<T> = [Scoping<T>, Scoping<T>, ...Scoping<T>[]]

export const or =
  <Branches extends ScopingBranches<T>, T>(
    ...branches: Branches
  ): ConditionFunction<T> =>
  (abiType: ParamType) => ({
    paramType: ParameterType.None,
    operator: Operator.Or,
    children: branches.map((branch) => mapScoping(branch, abiType)),
  })

export const and =
  <Branches extends ScopingBranches<T>, T>(
    ...branches: Branches
  ): ConditionFunction<T> =>
  (abiType: ParamType) => ({
    paramType: ParameterType.None,
    operator: Operator.And,
    children: branches.map((branch) => mapScoping(branch, abiType)),
  })
