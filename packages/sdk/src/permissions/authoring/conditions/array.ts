import { ParamType } from "ethers/lib/utils"

import { Condition, Operator, ParameterType } from "../../../types"

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
    if (abiType.baseType !== "array") {
      throw new Error("every() can only be used on array types")
    }
    if (elementScoping === undefined) {
      throw new Error("every() element condition must not be undefined")
    }
    return {
      paramType: ParameterType.Array,
      operator: Operator.ArrayEvery,
      children: [
        mapScoping(elementScoping, abiType.arrayChildren) as Condition, // cast is safe because of earlier elementScoping check
      ],
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
    if (abiType.baseType !== "array") {
      throw new Error("some() can only be used on array types")
    }
    if (elementScoping === undefined) {
      throw new Error("some() element condition must not be undefined")
    }
    return {
      paramType: ParameterType.Array,
      operator: Operator.ArraySome,
      children: [
        mapScoping(elementScoping, abiType.arrayChildren) as Condition, // cast is safe because of earlier elementScoping check
      ],
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
    if (abiType.baseType !== "array") {
      throw new Error("subset() can only be used on array types")
    }
    return {
      paramType: ParameterType.Array,
      operator: Operator.ArraySubset,
      children: elementScopings.map((elementScoping) => {
        if (elementScoping === undefined) {
          throw new Error("subset() element condition must not be undefined")
        }
        return mapScoping(elementScoping, abiType.arrayChildren) as Condition // cast is safe because of earlier elementScoping check
      }),
    }
  }
