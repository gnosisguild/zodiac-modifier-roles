import { ParamType } from "ethers/lib/utils"

import { Operator, ParameterType } from "../../../types"
import { PresetCondition } from "../../types"

import { mapScoping } from "./matches"
import { ConditionFunction, Scoping } from "./types"

type ScopingBranches<T> = [Scoping<T>, Scoping<T>, ...Scoping<T>[]]

/**
 * Passes if any of the branch conditions are true.
 * @param branches conditions to be evaluated
 */
export const or =
  <Branches extends ScopingBranches<T>, T>(
    ...branches: Branches
  ): ConditionFunction<T> =>
  (abiType: ParamType) => ({
    paramType: ParameterType.None,
    operator: Operator.Or,
    children: branches.map((branch) => {
      if (branch === undefined) {
        throw new Error("or() branch condition must not be undefined")
      }
      return mapScoping(branch, abiType) as PresetCondition // cast is safe because of earlier branch check
    }),
  })

/**
 * Passes if all of the branch conditions are true.
 * @param branches conditions to be evaluated
 */
export const and =
  <Branches extends ScopingBranches<T>, T>(
    ...branches: Branches
  ): ConditionFunction<T> =>
  (abiType: ParamType) => ({
    paramType: ParameterType.None,
    operator: Operator.And,
    children: branches.map((branch) => {
      if (branch === undefined) {
        throw new Error("and() branch condition must not be undefined")
      }
      return mapScoping(branch, abiType) as PresetCondition // cast is safe because of earlier branch check
    }),
  })
