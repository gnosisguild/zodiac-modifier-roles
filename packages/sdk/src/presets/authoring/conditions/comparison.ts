import { BigNumberish } from "ethers"
import { ParamType } from "ethers/lib/utils"

import { Operator, ParameterType } from "../../../types"
import { Placeholder } from "../../types"

import { ConditionFunction } from "./types"
import { describeStructure, parameterType, encodeValue } from "./utils"

/**
 * Asserts that the value from calldata is equal to the given value
 * @param value The reference value to encode or a placeholder
 */
export const eq =
  (value: Placeholder<any> | any): ConditionFunction<any> =>
  (abiType: ParamType) => {
    const type = ParamType.from(abiType)
    const structure = describeStructure(type)
    return {
      paramType: parameterType(type),
      operator: Operator.EqualTo,
      compValue: encodeValue(value, type),
      children: structure.children,
    }
  }

/**
 * Asserts that the value from calldata is greater than the given value
 * @param value The reference value to encode or a placeholder
 */
export const gt =
  (
    value: Placeholder<BigNumberish> | BigNumberish
  ): ConditionFunction<BigNumberish> =>
  (abiType: ParamType) => {
    const type = ParamType.from(abiType)
    if (!type.type.startsWith("uint") || !type.type.startsWith("int")) {
      throw new Error("`gt` is only supported for uint and int params")
    }
    return {
      paramType: ParameterType.Static,
      operator: type.type.startsWith("uint")
        ? Operator.GreaterThan
        : Operator.SignedIntGreaterThan,
      compValue: encodeValue(value, abiType),
    }
  }

/**
 * Asserts that the value from calldata is greater than the given value
 * @param value The reference value to encode or a placeholder
 */
export const lt =
  (
    value: Placeholder<BigNumberish> | BigNumberish
  ): ConditionFunction<BigNumberish> =>
  (abiType: ParamType) => {
    const type = ParamType.from(abiType)
    if (!type.type.startsWith("uint") || !type.type.startsWith("int")) {
      throw new Error("`lt` is only supported for uint and int params")
    }
    return {
      paramType: ParameterType.Static,
      operator: type.type.startsWith("uint")
        ? Operator.LessThan
        : Operator.SignedIntLessThan,
      compValue: encodeValue(value, abiType),
    }
  }
