import { ParamType } from "ethers/lib/utils"

import { Operator, ParameterType } from "../../types"
import { AbiType, Placeholder, PresetCondition } from "../types"

import { describeStructure, parameterType, encodeValue } from "./utils"

/**
 * Asserts that the value from calldata is equal to the given value
 * @param value The reference value to encode or a placeholder
 * @param type The ABI type
 */
function eq(value: Placeholder<any>, abiType?: AbiType): PresetCondition
function eq(value: any, abiType: AbiType): PresetCondition
function eq(value: Placeholder<any> | any, abiType?: AbiType): PresetCondition {
  const type = ParamType.from(abiType || value.type)
  const structure = describeStructure(type)
  return {
    paramType: parameterType(type),
    operator: Operator.EqualTo,
    compValue: encodeValue(value, type),
    children: structure.children,
  }
}
export { eq }

/**
 * Asserts that the value from calldata is greater than the given value
 * @param value The reference value to encode or a placeholder
 * @param type The ABI type
 */
function gt(value: Placeholder<any>, abiType?: AbiType): PresetCondition
function gt(value: any, abiType: AbiType): PresetCondition
function gt(value: Placeholder<any> | any, abiType?: AbiType): PresetCondition {
  const type = ParamType.from(abiType || value.type)
  if (!type.type.startsWith("uint") || !type.type.startsWith("int")) {
    console.warn(
      `Using a gt condition on non-numeric type ${type.type}, bytes will be interpreted as a uint256`
    )
  }
  return {
    paramType: ParameterType.Static,
    operator: Operator.GreaterThan,
    compValue: encodeValue(value, abiType),
  }
}
export { gt }

/**
 * Asserts that the value from calldata is greater than the given value
 * @param value The reference value to encode or a placeholder
 * @param type The ABI type
 */
function lt(value: Placeholder<any>, abiType?: AbiType): PresetCondition
function lt(value: any, abiType: AbiType): PresetCondition
function lt(value: Placeholder<any> | any, abiType?: AbiType): PresetCondition {
  const type = ParamType.from(abiType || value.type)
  if (!type.type.startsWith("uint") || !type.type.startsWith("int")) {
    console.warn(
      `Using a lt condition on non-numeric type ${type.type}, bytes will be interpreted as a uint256`
    )
  }
  return {
    paramType: ParameterType.Static,
    operator: Operator.LessThan,
    compValue: encodeValue(value, abiType),
  }
}
export { lt }

/**
 * Asserts that the value from calldata is equal to one of the given values
 * @param values The reference values or placeholders
 * @param type The ABI type
 */
function oneOf(
  values: (Placeholder<any> | any)[],
  type: AbiType
): PresetCondition {
  return {
    paramType: ParameterType.None,
    operator: Operator.Or,
    children: values.map((value) => eq(value, type)),
  }
}
export { oneOf }

/**
 * Asserts that the array value from calldata only contains elements that are equal to one of the given values.
 *
 * Every reference value can only be matched once, so you need to pass an array with multiple copies of the same value if you want to allow multiple occurrences.
 * @param values The reference values or placeholders
 * @param type The ABI type (must be an array type)
 */
function subsetOf(
  values: (Placeholder<any> | any)[],
  type: AbiType
): PresetCondition {
  const paramType = ParamType.from(type)
  if (paramType.baseType !== "array") {
    throw new Error("subsetOf can only be used with array types")
  }

  return {
    paramType: ParameterType.Array,
    operator: Operator.ArraySubset,
    children: values.map((value) => eq(value, type)),
  }
}
export { subsetOf }
