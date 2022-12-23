import { solidityPack } from "ethers/lib/utils"

import {
  Comparison,
  ExecutionOptions,
  ParameterType,
  PresetAllowEntry,
  PresetScopeParam,
} from "../../types"
import { isPlaceholder } from "../placeholders"
import { Placeholder } from "../types"

const solidityPackPadded = (type: string, value: any): string => {
  const packed = solidityPack([type], [value]).slice(2)
  const padded = packed.padStart(64, "0")
  return "0x" + padded
}

const encodeValue = (value: any, type?: string): string | Placeholder<any> => {
  let encodedValue = value
  if (!isPlaceholder(value)) {
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

const getAllSubsets = (array: any[], includeEmpty = false) =>
  array
    .reduce(
      (subsets, value) =>
        subsets.concat(subsets.map((set: any[]) => [...set, value])),
      [[]]
    )
    .slice(includeEmpty ? 0 : 1)

const getAllPermutations = (array: any[]) => {
  const result: any[][] = []

  const permute = (arr: any[], m: any[] = []) => {
    if (arr.length === 0) {
      result.push(m)
    } else {
      for (let i = 0; i < arr.length; i++) {
        const curr = arr.slice()
        const next = curr.splice(i, 1)
        permute(curr.slice(), m.concat(next))
      }
    }
  }

  permute(array)

  return result
}

interface Options {
  includeEmpty?: boolean
  restrictOrder?: boolean
}
export const subsetOf = (
  values: any[],
  type: string,
  options: Options = {}
): PresetScopeParam => {
  if (!type.endsWith("[]")) {
    throw new Error("type must be an array type")
  }
  const subsets = getAllSubsets(values, options.includeEmpty)
  const allowedValues = options.restrictOrder
    ? subsets
    : subsets.flatMap(getAllPermutations)
  return dynamic32OneOf(allowedValues, type)
}

interface PresetFullyClearedTarget {
  options?: ExecutionOptions
}
type PresetFunction = ({ sighash: string } | { signature: string }) & {
  params?: (PresetScopeParam | undefined)[] | Record<number, PresetScopeParam>
  options?: ExecutionOptions
}
export const forAllTargetAddresses = (
  targetAddresses: string[],
  allow:
    | PresetFullyClearedTarget
    | PresetFunction
    | (PresetFullyClearedTarget | PresetFunction)[]
): PresetAllowEntry[] => {
  const allowArray = Array.isArray(allow) ? allow : [allow]
  return targetAddresses.flatMap((targetAddress) =>
    allowArray.map((allow) => ({ targetAddress, ...allow }))
  )
}

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
