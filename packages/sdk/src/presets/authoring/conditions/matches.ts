import { isBigNumberish } from "@ethersproject/bignumber/lib/bignumber"
import { ParamType } from "ethers/lib/utils"

import { Operator, ParameterType } from "../../../types"
import { Placeholder, PresetCondition } from "../../types"

import { eq } from "./comparison"
import {
  ConditionFunction,
  Scoping,
  StructScoping,
  TupleScopings,
} from "./types"
import { describeStructure, parameterType } from "./utils"

/**
 * Matches a tuple or array against a structure of conditions.
 *
 * Throws if the type is not a tuple or array. Throws if the structure of conditions is incompatible with the type.
 * @param scoping The conditions on the tuple or array elements
 */
export const matches =
  <S extends TupleScopings<any> | StructScoping<any>>(scoping: S) =>
  (abiType: ParamType) => {
    // The type system allows for nesting matches(matches()).
    // While using this in practice would not make too much sense, we must make sure it's valid nonetheless.
    if (typeof scoping === "function") {
      return scoping(abiType)
    }

    let conditions: (PresetCondition | undefined)[]

    console.log({ scoping, abiType })

    if (Array.isArray(scoping)) {
      // scoping is an array (TupleScopings)

      // supported for tuple and array types
      if (abiType.baseType !== "tuple" && abiType.baseType !== "array") {
        throw new Error(
          `Can only use \`matches\` on tuple or array type params, got: ${abiType.type}`
        )
      }

      // map scoping items to conditions
      conditions = scoping.map((scoping, index) =>
        mapScoping(
          scoping,
          abiType.baseType === "tuple"
            ? abiType.components[index]
            : abiType.arrayChildren
        )
      )
    } else {
      // scoping is an object (StructScoping)

      // only supported for tuple types
      if (abiType.baseType !== "tuple") {
        throw new Error(
          `Can only use \`matches\` with scoping object on tuple type params, got: ${abiType.type}`
        )
      }

      // map scoping values to conditions
      conditions = abiType.components.map((componentType) =>
        mapScoping(scoping[componentType.name], componentType)
      )
    }

    // sanity checks
    assertValidConditionsLength(conditions, abiType)
    assertValidConditionsKeys(scoping, abiType)
    assertCompatibleParamTypes(conditions, abiType)

    return {
      paramType: parameterType(abiType),
      operator: Operator.Matches,
      children: conditions.map(
        (condition, index) =>
          condition ||
          describeStructure(
            abiType.baseType === "tuple"
              ? abiType.components[index]
              : abiType.arrayChildren
          )
      ),
    }
  }

export const matchesAbi =
  <S extends TupleScopings<any>>(scopings: S, abiTypes: ParamType[]) =>
  (abiType?: ParamType) => {
    // only supported at the top level or for bytes type params
    if (abiType && abiType.name !== "bytes") {
      throw new Error(
        `Can only use \`matchesAbi\` on bytes types params, got: ${abiType.type}`
      )
    }

    // map scoping items to conditions
    const conditions: (PresetCondition | undefined)[] = abiTypes.map(
      (type, index) => mapScoping(scopings[index], type)
    )

    // sanity checks
    assertValidConditionsKeys(conditions, abiTypes)
    assertCompatibleParamTypes(conditions, abiTypes)

    return {
      paramType: ParameterType.AbiEncoded,
      operator: Operator.Matches,
      children: conditions.map(
        (condition, index) => condition || describeStructure(abiTypes[index])
      ),
    }
  }

/**
 * Maps a scoping (shortcut notation or condition function) to preset conditions.
 * @param scoping The scoping to map.
 * @param abiType The abi type of the parameter the scoping applies to.
 * @returns
 */
export function mapScoping(
  scoping: Scoping<any> | undefined,
  abiType: ParamType
): PresetCondition | undefined {
  if (scoping === undefined) {
    return undefined
  }

  let conditionFunction: ConditionFunction<any>

  if (typeof scoping === "function") {
    // scoping is already a condition function
    conditionFunction = scoping
  } else if (
    scoping instanceof Placeholder ||
    typeof scoping === "boolean" ||
    typeof scoping === "string" ||
    typeof scoping === "number" ||
    Array.isArray(scoping) ||
    isBigNumberish(scoping)
  ) {
    // placeholders, primitive values, and arrays default to eq condition
    conditionFunction = eq(scoping)
  } else {
    // object values default to matches condition
    conditionFunction = matches(scoping)
  }

  return conditionFunction(abiType)
}

const assertValidConditionsLength = (
  conditions: (PresetCondition | undefined)[],
  typeOrTypes: ParamType | ParamType[]
) => {
  const expectedLength = Array.isArray(typeOrTypes)
    ? typeOrTypes.length
    : typeOrTypes.arrayLength
  if (expectedLength <= 0) return

  if (conditions.length > expectedLength) {
    throw new Error(
      `The conditions structure has too many elements (expected length: ${expectedLength}, conditions length: ${conditions.length})`
    )
  }
}

const assertValidConditionsKeys = (
  structure: TupleScopings<any> | StructScoping<any>,
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
