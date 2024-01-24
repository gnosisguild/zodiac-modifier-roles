import { BigNumberish } from "ethers"
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

export const staticLessThan = (value: BigNumberish): PresetScopeParam => ({
  comparison: Comparison.LessThan,
  type: ParameterType.Static,
  value: encodeValue(value, "uint256"),
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
  if (values.length > 5) {
    // the number of subsets explodes quickly, so we limit it to 5 which means (2^5)-1 = 31 with restrictOrder, and 5! / (5-5)! = 120 without
    throw new Error("too many values")
  }

  if (!type.endsWith("[]")) {
    throw new Error("type must be an array type")
  }
  const subsets = getAllSubsets(values, options.includeEmpty)
  const allowedValues = options.restrictOrder
    ? subsets
    : subsets.flatMap(getAllPermutations)
  return dynamic32OneOf(allowedValues, type)
}

type PartialPresetFullyClearedTarget = ExecutionOptions
type PartialPresetFunction = ({ sighash: string } | { signature: string }) & {
  params?: (PresetScopeParam | undefined)[] | Record<number, PresetScopeParam>
} & ExecutionOptions
export const forAllTargetAddresses = (
  targetAddresses: string[],
  allow:
    | PartialPresetFullyClearedTarget
    | PartialPresetFunction
    | (PartialPresetFullyClearedTarget | PartialPresetFunction)[]
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
