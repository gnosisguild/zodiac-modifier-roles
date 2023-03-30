import { ParamType } from "ethers/lib/utils"

import { Operator, ParameterType } from "../../../types"

import { mapScoping } from "./matches"
import { ArrayElement, ConditionFunction, Scoping } from "./types"

/**
 * Passes if every element of the array matches the given condition.
 * @param elementScoping The condition on the array elements
 */
export const every =
  <S extends Scoping<ArrayElement<T>>, T extends any[]>(
    elementScoping: S
  ): ConditionFunction<T> =>
  (abiType: ParamType) => {
    if (abiType.type !== "array") {
      throw new Error("every() can only be used on array types")
    }
    return {
      paramType: ParameterType.Array,
      operator: Operator.ArrayEvery,
      children: [mapScoping(elementScoping, abiType.arrayChildren)],
    }
  }

/**
 * Passes if at least one element of the array matches the given condition.
 * @param elementScoping The condition on the array elements
 */
export const some =
  <S extends Scoping<ArrayElement<T>>, T extends any[]>(
    elementScoping: S
  ): ConditionFunction<T> =>
  (abiType: ParamType) => {
    if (abiType.type !== "array") {
      throw new Error("some() can only be used on array types")
    }
    return {
      paramType: ParameterType.Array,
      operator: Operator.ArraySome,
      children: [mapScoping(elementScoping, abiType.arrayChildren)],
    }
  }

/**
 * Passes if every element of the array matches one of the given conditions. Every condition must be used at most once.
 * @param elementScopings The conditions on the array elements
 */
export const subset =
  <S extends Scoping<ArrayElement<T>>[], T extends any[]>(
    elementScopings: S
  ): ConditionFunction<T> =>
  (abiType: ParamType) => {
    if (abiType.type !== "array") {
      throw new Error("subset() can only be used on array types")
    }
    return {
      paramType: ParameterType.Array,
      operator: Operator.ArraySubset,
      children: elementScopings.map((elementScoping) =>
        mapScoping(elementScoping, abiType.arrayChildren)
      ),
    }
  }
