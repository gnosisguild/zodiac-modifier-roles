import { ParamType } from "ethers/lib/utils"

import { Operator, ParameterType } from "../../types"
import { AbiType, PresetCondition } from "../types"

import { describeStructure, parameterType } from "./utils"

type RecordOrArray<T> = { [name: string]: T } | T[]

/**
 * Matches a tuple or array against a structure of conditions.
 *
 * Throws if the type is not a tuple or array. Throws if the structure of conditions is incompatible with the type.
 * @param structure The structure of conditions
 * @param type The ABI type describing the tuple or array
 */
function matches(
  structure: RecordOrArray<PresetCondition | undefined>,
  type: AbiType
): PresetCondition

/**
 * Matches ABI encoded data (calldata or bytes type values) against a structure of conditions.
 *
 * Throws if the structure of conditions is incompatible with the types.
 * @param structure The structure of conditions
 * @param types The ABI types describing the encoding
 */
function matches(
  structure: RecordOrArray<PresetCondition | undefined>,
  types: AbiType[]
): PresetCondition

function matches(
  structure: RecordOrArray<PresetCondition | undefined>,
  typeOrTypes: AbiType | AbiType[]
): PresetCondition {
  const types = coerceTypes(typeOrTypes)
  const arrayStructure = Array.isArray(structure)
    ? structure
    : types.map((type) => structure[type.name])
  const isMatchOnArray =
    !Array.isArray(typeOrTypes) &&
    ParamType.from(typeOrTypes).baseType === "array"

  // sanity checks
  if (!isMatchOnArray && arrayStructure.length > types.length) {
    throw new Error("The conditions structure has too many elements")
  }
  assertValidStructureKeys(structure, types)
  assertCompatibleParamTypes(arrayStructure, types)

  return {
    paramType: Array.isArray(typeOrTypes)
      ? ParameterType.AbiEncoded
      : parameterType(typeOrTypes),
    operator: Operator.Matches,
    children: arrayStructure.map(
      (condition, index) => condition || describeStructure(types[index])
    ),
  }
}

export { matches }

const coerceTypes = (typeOrTypes: AbiType | AbiType[]): ParamType[] => {
  if (Array.isArray(typeOrTypes)) {
    return typeOrTypes.map((type) => ParamType.from(type))
  } else {
    const type = ParamType.from(typeOrTypes)
    if (type.baseType !== "tuple" && type.baseType !== "array") {
      throw new Error("The type for matching must be a tuple or array")
    }
    return type.baseType !== "tuple" ? type.components : [type.arrayChildren]
  }
}

const assertValidStructureKeys = (
  structure: RecordOrArray<PresetCondition | undefined>,
  types: ParamType[]
) => {
  const unusedStructureKeys = Array.isArray(structure)
    ? []
    : arrayDiff(
        Object.keys(structure),
        types.map((type) => type.name)
      )
  if (unusedStructureKeys.length > 0) {
    throw new Error(
      `The conditions structure has unknown keys: ${unusedStructureKeys.join(
        ", "
      )}`
    )
  }
}

const assertCompatibleParamTypes = (
  arrayStructure: (PresetCondition | undefined)[],
  types: ParamType[]
) => {
  arrayStructure.forEach((condition, index) => {
    if (!condition) return
    const expectedType = parameterType(types[index])
    if (condition.paramType !== expectedType) {
      const fieldReference = `'${types[index].name}'` || `at index ${index}`
      throw new Error(
        `Condition for field ${fieldReference} has wrong paramType ${
          ParameterType[condition.paramType]
        }} (expected ${ParameterType[expectedType]}))`
      )
    }
  })
}

const arrayDiff = (a: string[], b: string[]) => {
  const set = new Set(b)
  return a.filter((x) => !set.has(x))
}
