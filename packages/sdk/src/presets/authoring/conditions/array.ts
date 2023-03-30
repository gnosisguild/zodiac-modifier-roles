import { ParamType } from "ethers/lib/utils"

import { Operator, ParameterType } from "../../../types"

import { mapScoping } from "./matches"
import { ArrayElement, ConditionFunction, Scoping } from "./types"

export const every =
  <S extends T, T extends any[]>(
    elementScoping: Scoping<ArrayElement<S>>
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
