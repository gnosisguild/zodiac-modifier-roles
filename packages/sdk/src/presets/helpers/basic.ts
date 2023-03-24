import { defaultAbiCoder, ParamType, solidityPack } from "ethers/lib/utils"

import { Operator, ParameterType } from "../../types"
import {
  AbiType,
  Placeholder,
  PresetAllowEntry,
  PresetScopeParam,
} from "../types"

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

/**
 * EqualTo comparison for static length types (uint, int, address, bool, etc.)
 * @param value The value to encode or a placeholder
 * @param type The ABI type
 */
function staticEqualTo(
  value: Placeholder<any>,
  type?: AbiType
): PresetScopeParam
function staticEqualTo(value: any, type: AbiType): PresetScopeParam
function staticEqualTo(
  value: Placeholder<any> | any,
  type?: AbiType
): PresetScopeParam {
  return {
    type: ParameterType.Static,
    operator: Operator.EqualTo,
    compValue: encodeValue(value, type),
  }
}
export { staticEqualTo }

const isDynamicType = (type: AbiType): boolean => {
  const stringType = typeof type === "string" ? type : type.format("sighash")
  return stringType === "string" || stringType === "bytes"
}

/**
 * EqualTo comparison for dynamic length types (string, bytes)
 * @param value The value to encode or a placeholder
 * @param type The ABI type
 */
function dynamicEqualTo(
  value: Placeholder<any>,
  type?: AbiType
): PresetScopeParam
function dynamicEqualTo(value: any, type: AbiType): PresetScopeParam
function dynamicEqualTo(
  value: Placeholder<any> | any,
  type?: AbiType
): PresetScopeParam {
  return {
    type: ParameterType.Dynamic,
    operator: Operator.EqualTo,
    compValue: encodeValue(value, type),
  }
}
export { dynamicEqualTo }

// for any array types
export const arrayEqualTo = (value: any[], type: string): PresetScopeParam => ({
  comparison: Comparison.EqualTo,
  type: ParameterType.Array,
  value: encodeValue(value, type),
})

// for any fixed length types
export const staticOneOf = (value: any[], type?: string): PresetScopeParam => ({
  comparison: Comparison.OneOf,
  type: ParameterType.Static,
  value: value.map((v) => encodeValue(v, type)),
})

// for string & bytes
export const dynamicOneOf = (
  value: any[],
  type?: string
): PresetScopeParam => ({
  comparison: Comparison.OneOf,
  type: ParameterType.Dynamic,
  value: value.map((v) => encodeValue(v, type)),
})

// for any array types
export const arrayOneOf = (value: any[][], type: string): PresetScopeParam => ({
  paramType: ParameterType.Array,
  comparison: Operator.OneOf,
  value: value.map((v) => encodeValue(v, type)),
})
