import { ParamType } from "ethers/lib/utils"

import { Operator, ParameterType } from "../../../types"
import { Placeholder } from "../../types"

import { describeStructure, parameterType, encodeValue } from "./utils"

/**
 * Asserts that the value from calldata is equal to the given value
 * @param value The reference value to encode or a placeholder
 */
export const eq = (value: Placeholder<any> | any) => (abiType: ParamType) => {
  const type = ParamType.from(abiType || value.type)
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
export const gt = (value: Placeholder<any> | any) => (abiType: ParamType) => {
  const type = ParamType.from(abiType || value.type)
  if (!type.type.startsWith("uint") || !type.type.startsWith("int")) {
    console.warn(
      `Using a gt condition on non-numeric type ${type.type}, bytes will be interpreted as a uint256`
    )
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
export const lt = (value: Placeholder<any> | any) => (abiType: ParamType) => {
  const type = ParamType.from(abiType || value.type)
  if (!type.type.startsWith("uint") || !type.type.startsWith("int")) {
    console.warn(
      `Using a lt condition on non-numeric type ${type.type}, bytes will be interpreted as a uint256`
    )
  }
  return {
    paramType: ParameterType.Static,
    operator: type.type.startsWith("uint")
      ? Operator.LessThan
      : Operator.SignedIntLessThan,
    compValue: encodeValue(value, abiType),
  }
}
