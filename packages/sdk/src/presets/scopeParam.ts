import { ParamType, solidityPack } from "ethers/lib/utils"

import { Comparison, ParameterType as PresetScopeParamType } from "../types"

import { subsetOf } from "./helpers/utils"
import {
  ParamScoping,
  Placeholder,
  PresetScopeParam,
  StructScopings,
  TupleScopings,
} from "./types"

export const scopeParam = <T>(
  paramScoping: ParamScoping<T> | undefined,
  paramType: ParamType
): PresetScopeParam | undefined | (PresetScopeParam | undefined)[] => {
  if (!paramScoping) return undefined

  const {
    baseType, // The base type of the parameter. For primitive types (e.g. address, uint256, etc) this is equal to type. For arrays, it will be the string "array" and for a tuple, it will be the string "tuple".
    arrayLength, // The length of the array, or -1 for dynamic-length arrays.
    arrayChildren, // The type of children of the array.
    components, // The components of a tuple.
  } = paramType

  // the fields of tuples and fixed-size arrays are encoded inline, one after the other, producing just the same result as a flat list of parameters
  if (baseType === "tuple") {
    return components.flatMap((component) =>
      scopeParam(
        (paramScoping as StructScopings<any>)[component.name],
        component
      )
    )
  }
  if (baseType === "array" && arrayLength >= 0) {
    return new Array(arrayLength)
      .fill(undefined)
      .flatMap((_, index) =>
        scopeParam((paramScoping as TupleScopings<any>)[index], arrayChildren)
      )
  }

  let type: PresetScopeParamType
  switch (baseType) {
    case "string":
    case "bytes":
      type = PresetScopeParamType.Dynamic
      break
    case "array":
      type = PresetScopeParamType.Dynamic32
      break
    default:
      type = PresetScopeParamType.Static
  }

  if (typeof paramScoping === "object" && "oneOf" in paramScoping) {
    return {
      comparison: Comparison.OneOf,
      type,
      value: (paramScoping as any).oneOf.map((v: any) =>
        encodeValue(v, paramType.format())
      ),
    }
  }

  if (typeof paramScoping === "object" && "subsetOf" in paramScoping) {
    if (type !== PresetScopeParamType.Dynamic32) {
      throw new Error("subsetOf only works for arrays")
    }

    return subsetOf(
      (paramScoping as any).subsetOf,
      paramType.format(),
      paramScoping
    )
  }

  return {
    comparison: Comparison.EqualTo,
    type,
    value: encodeValue(paramScoping, paramType.format()),
  }
}

export const solidityPackPadded = (type: string, value: any): string => {
  const packed = solidityPack([type], [value]).slice(2)
  const padded = packed.padStart(64, "0")
  return "0x" + padded
}

const encodeValue = (value: any, type: string): string | Placeholder<any> => {
  let encodedValue = value
  if (!(value instanceof Placeholder)) {
    encodedValue = solidityPackPadded(type, value)
  }
  return encodedValue
}
