import { defaultAbiCoder, ParamType } from "ethers/lib/utils"

import { Condition, Operator, ParameterType } from "../../types"
import { AbiType, Placeholder, PresetCondition } from "../types"

/**
 * Asserts that the value from calldata is equal to the given value
 * @param value The reference value to encode or a placeholder
 * @param type The ABI type
 */
function equalTo(value: Placeholder<any>, type?: AbiType): PresetCondition
function equalTo(value: any, type: AbiType): PresetCondition
function equalTo(
  value: Placeholder<any> | any,
  type?: AbiType
): PresetCondition {
  const structure = describeStructure(type || value.type)
  return {
    paramType: parameterType(type || value.type),
    operator: Operator.EqualTo,
    compValue: encodeValue(value, type),
    children: structure.children,
  }
}
export { equalTo }

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
    children: values.map((value) => equalTo(value, type)),
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
    children: values.map((value) => equalTo(value, type)),
  }
}
export { subsetOf }

const encodeValue = (value: any, type?: AbiType): string | Placeholder<any> => {
  if (value instanceof Placeholder) {
    return type ? value.as(type) : value
  } else {
    if (!type) {
      throw new Error("the value type must be specified")
    }
    return defaultAbiCoder.encode([type], [value])
  }
}

const parameterType = (type: AbiType): ParameterType => {
  const paramType = ParamType.from(type)
  switch (paramType.baseType) {
    case "tuple":
      return ParameterType.Tuple
    case "array":
      return ParameterType.Array
    case "string":
    case "bytes":
      return ParameterType.Dynamic
    default:
      return ParameterType.Static
  }
}

const describeStructure = (type: AbiType): Condition => {
  const paramType = ParamType.from(type)
  const children = paramType.arrayChildren
    ? [paramType.arrayChildren]
    : paramType.components

  return {
    paramType: parameterType(type),
    operator: Operator.Pass,
    children: children.length > 0 ? children.map(describeStructure) : undefined,
  }
}
