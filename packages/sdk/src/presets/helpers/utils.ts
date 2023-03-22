import { solidityPack } from "ethers/lib/utils"

import { Comparison, ParameterType } from "../../types"
import {
  ExecutionOptions,
  Placeholder,
  PresetAllowEntry,
  PresetScopeParam,
} from "../types"

const solidityPackPadded = (type: string, value: any): string => {
  const packed = solidityPack([type], [value]).slice(2)
  const padded = packed.padStart(64, "0")
  return "0x" + padded
}

const encodeValue = (value: any, type?: string): string | Placeholder<any> => {
  let encodedValue = value
  if (!(value instanceof Placeholder)) {
    if (!type) {
      throw new Error("the value type must be specified")
    } else {
      encodedValue = solidityPackPadded(type, value)
    }
  }
  return encodedValue
}

// for any fixed length types
export const staticEqual = (value: any, type?: string): PresetScopeParam => ({
  comparison: Comparison.EqualTo,
  type: ParameterType.Static,
  value: encodeValue(value, type),
})

// for string & bytes
export const dynamicEqual = (value: any, type?: string): PresetScopeParam => ({
  comparison: Comparison.EqualTo,
  type: ParameterType.Dynamic,
  value: encodeValue(value, type),
})

// for any array types
export const dynamic32Equal = (
  value: any[],
  type: string
): PresetScopeParam => ({
  comparison: Comparison.EqualTo,
  type: ParameterType.Dynamic32,
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
export const dynamic32OneOf = (
  value: any[][],
  type: string
): PresetScopeParam => ({
  comparison: Comparison.OneOf,
  type: ParameterType.Dynamic32,
  value: value.map((v) => encodeValue(v, type)),
})

// export const greaterThanUint = (
//   value: number | string | BigInt
// ): ScopeParam => ({
//   comparison: Comparison.GreaterThan,
//   type: ParameterType.Static,
//   value: defaultAbiCoder.encode(["uint256"], [value]),
// });
// export const greaterThanInt = (
//   value: number | string | BigInt
// ): ScopeParam => ({
//   comparison: Comparison.GreaterThan,
//   type: ParameterType.Static,
//   value: defaultAbiCoder.encode(["int256"], [value]),
// });
