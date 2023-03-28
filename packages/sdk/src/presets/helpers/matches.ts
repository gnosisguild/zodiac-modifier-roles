import { ParamType } from "ethers/lib/utils"

import { Operator, ParameterType } from "../../types"
import { AbiType, PresetCondition } from "../types"

import { describeStructure, parameterType } from "./utils"

type RecordOrArray<T> = { [name: string]: T } | T[]

/**
 * Matches a tuple or array against a structure of conditions.
 *
 * Throws if the type is not a tuple or array. Throws if the structure of conditions is incompatible with the type.
 * @param structure The conditions on the tuple or array elements
 * @param type The ABI type describing the tuple or array
 */
export function matches(
  structure: RecordOrArray<PresetCondition | undefined>,
  abiType: AbiType
): PresetCondition {
  const type = ParamType.from(abiType)
  if (type.baseType !== "tuple" && type.baseType !== "array") {
    throw new Error("The type for matching must be a tuple or array")
  }

  let arrayStructure: (PresetCondition | undefined)[]
  if (Array.isArray(structure)) {
    arrayStructure = structure
  } else if (type.baseType === "tuple") {
    arrayStructure = type.components.map((type) => structure[type.name])
  } else {
    throw new Error("The structure for matching an array must be an array")
  }

  // sanity checks
  assertValidStructureLength(arrayStructure, type)
  assertValidStructureKeys(structure, type)
  assertCompatibleParamTypes(arrayStructure, type)

  return {
    paramType: parameterType(type),
    operator: Operator.Matches,
    children: arrayStructure.map(
      (condition, index) =>
        condition ||
        describeStructure(
          type.baseType === "tuple"
            ? type.components[index]
            : type.arrayChildren
        )
    ),
  }
}

/**
 * Matches ABI encoded data (calldata or bytes type values) against a structure of conditions.
 *
 * Throws if the structure of conditions is incompatible with the types.
 * @param structure The conditions on the individual ABI encoded values
 * @param types The ABI types describing the encoding
 */
export function matchesAbi(
  structure: (PresetCondition | undefined)[],
  abiTypes: AbiType[]
): PresetCondition {
  const types = abiTypes.map((type) => ParamType.from(type))

  // sanity checks
  assertValidStructureKeys(structure, types)
  assertCompatibleParamTypes(structure, types)

  return {
    paramType: ParameterType.AbiEncoded,
    operator: Operator.Matches,
    children: structure.map(
      (condition, index) => condition || describeStructure(types[index])
    ),
  }
}

const assertValidStructureLength = (
  arrayStructure: (PresetCondition | undefined)[],
  typeOrTypes: ParamType | ParamType[]
) => {
  const expectedLength = Array.isArray(typeOrTypes)
    ? typeOrTypes.length
    : typeOrTypes.arrayLength
  if (expectedLength <= 0) return

  if (arrayStructure.length > expectedLength) {
    throw new Error(
      `The conditions structure has too many elements (expected length: ${expectedLength}, conditions length: ${arrayStructure.length})`
    )
  }
}

const assertValidStructureKeys = (
  structure: RecordOrArray<PresetCondition | undefined>,
  typeOrTypes: ParamType | ParamType[]
) => {
  if (Array.isArray(structure)) return
  if (!Array.isArray(typeOrTypes) && typeOrTypes.baseType !== "tuple") return

  const types = Array.isArray(typeOrTypes)
    ? typeOrTypes
    : typeOrTypes.components

  const unusedStructureKeys = arrayDiff(
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
  typeOrTypes: ParamType | ParamType[]
) => {
  arrayStructure.forEach((condition, index) => {
    if (!condition) return
    const type = Array.isArray(typeOrTypes) ? typeOrTypes[index] : typeOrTypes
    const expectedType = parameterType(type)
    if (condition.paramType !== expectedType) {
      const fieldReference = `'${type.name}'` || `at index ${index}`
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
