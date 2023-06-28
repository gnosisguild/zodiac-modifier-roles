import { isBigNumberish } from "@ethersproject/bignumber/lib/bignumber"
import { ParamType } from "ethers/lib/utils"

import { Operator, ParameterType } from "../../../types"
import {
  AbiType,
  Placeholder,
  PresetCondition,
  PresetFunction,
} from "../../types"
import { coercePresetFunction } from "../../utils"

import { and } from "./branching"
import { bitmask, eq } from "./comparison"
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

const calldataMatchesScopings =
  <S extends TupleScopings<any>>(
    scopings: S,
    abiTypes: AbiType[],
    selector?: `0x${string}`
  ) =>
  (abiType?: ParamType) => {
    const paramTypes = abiTypes.map((abiType) => ParamType.from(abiType))

    // only supported at the top level or for bytes type params
    if (abiType && abiType.type !== "bytes") {
      throw new Error(
        `Can only use \`calldataMatches\` on bytes type params, got: ${abiType.type}`
      )
    }

    // map scoping items to conditions
    const conditions: (PresetCondition | undefined)[] = paramTypes.map(
      (type, index) => mapScoping(scopings[index], type)
    )

    // sanity checks
    assertValidConditionsKeys(conditions, paramTypes)
    assertCompatibleParamTypes(conditions, paramTypes)

    const matchesCondition = {
      paramType: ParameterType.AbiEncoded, // TODO change to Calldata after contract updates
      operator: Operator.Matches,
      children: conditions.map(
        (condition, index) => condition || describeStructure(paramTypes[index])
      ),
    }

    if (selector) {
      if (selector.length !== 10) {
        throw new Error(
          `Selector must be exactly 4 bytes long, got: ${selector.length}`
        )
      }

      return and(
        bitmask({ mask: selector, value: selector }),
        () => matchesCondition
      )(ParamType.from("bytes"))
    }

    return matchesCondition
  }

const calldataMatchesPresetFunction =
  (presetFunction: PresetFunction) => (abiType?: ParamType) => {
    // only supported at the top level or for bytes type params
    if (abiType && abiType.type !== "bytes") {
      throw new Error(
        `Can only use \`calldataMatches\` on bytes type params, got: ${abiType.type}`
      )
    }

    const { selector, condition } = coercePresetFunction(presetFunction)
    if (condition) {
      if (
        condition.operator !== Operator.Matches ||
        condition.paramType !== ParameterType.AbiEncoded
      ) {
        throw new Error(
          `calldataMatches expects a preset function with an \`Operator.matches\`, \`ParamType.Calldata\` condition, got: \`Operator.${
            Operator[condition.operator]
          }\`, \`ParamType.${ParameterType[condition.paramType]}\``
        )
      }
    }

    const selectorCondition = bitmask({
      mask: "0xffffffff0000000000000000000000",
      value: selector,
    })

    return (
      condition ? and(selectorCondition, () => condition) : selectorCondition
    )(ParamType.from("bytes"))
  }

type CalldataMatches = {
  /**
   * Matches the parameters part of EVM call data against a structure of conditions.
   *
   * Skips over the first 4 bytes (function selector) and matches the ABI encoded parameters against the structure of conditions.
   * Optionally, also checks the function selector.
   *
   * @param scoping The conditions structure over the decoded parameters
   * @param abiTypes The parameter types defining how to decode bytes
   * @param selector If set, checks that the 4 bytes function selector matches the given value
   **/
  <S extends TupleScopings<any>>(
    scopings: S,
    abiTypes: AbiType[],
    selector?: `0x${string}`
  ): (abiType?: ParamType) => PresetCondition

  /**
   * Matches EVM calldata TODO
   *
   * @param presetFunction TODO
   **/
  (presetFunction: PresetFunction): (abiType?: ParamType) => PresetCondition
}

export const calldataMatches: CalldataMatches = <S extends TupleScopings<any>>(
  scopingsOrPresetFunction: S | PresetFunction,
  abiTypes?: AbiType[],
  selector?: `0x${string}`
): ((abiType?: ParamType) => PresetCondition) => {
  return Array.isArray(scopingsOrPresetFunction) && abiTypes
    ? calldataMatchesScopings(scopingsOrPresetFunction, abiTypes, selector)
    : calldataMatchesPresetFunction(
        scopingsOrPresetFunction as unknown as PresetFunction
      )
}

/**
 * Matches standard ABI encoded bytes against a structure of conditions.
 *
 * @param scoping The conditions structure over the decoded parameters
 * @param abiTypes The parameter types defining how to decode bytes
 **/
export const abiEncodedMatches =
  <S extends TupleScopings<any>>(scopings: S, abiTypes: AbiType[]) =>
  (abiType?: ParamType) => {
    const paramTypes = abiTypes.map((abiType) => ParamType.from(abiType))

    // only supported at the top level or for bytes type params
    if (abiType && abiType.type !== "bytes") {
      throw new Error(
        `Can only use \`abiEncodedMatches\` on bytes type params, got: ${abiType.type}`
      )
    }

    // map scoping items to conditions
    const conditions: (PresetCondition | undefined)[] = paramTypes.map(
      (type, index) => mapScoping(scopings[index], type)
    )

    // sanity checks
    assertValidConditionsKeys(conditions, paramTypes)
    assertCompatibleParamTypes(conditions, paramTypes)

    return {
      paramType: ParameterType.AbiEncoded, // TODO should this just be Dynamic?
      operator: Operator.Matches,
      children: conditions.map(
        (condition, index) => condition || describeStructure(paramTypes[index])
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
  let expectedLength: number
  if (Array.isArray(typeOrTypes)) {
    expectedLength = typeOrTypes.length
  } else if (typeOrTypes.baseType === "tuple") {
    expectedLength = typeOrTypes.components.length
  } else if (typeOrTypes.baseType === "array") {
    expectedLength = typeOrTypes.arrayLength
  } else {
    throw new Error(
      `Can only use \`matches\` on tuple or array type params, got: \`${typeOrTypes.format(
        "sighash"
      )}\``
    )
  }

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
  conditions: (PresetCondition | undefined)[],
  typeOrTypes: ParamType | ParamType[]
) => {
  conditions.forEach((condition, index) => {
    if (!condition) return
    let type: ParamType

    if (Array.isArray(typeOrTypes)) {
      type = typeOrTypes[index]
    } else if (typeOrTypes.baseType === "tuple") {
      type = typeOrTypes.components[index]
    } else if (typeOrTypes.baseType === "array") {
      type = typeOrTypes.arrayChildren
    } else {
      throw new Error(
        `Can only use \`matches\` on tuple or array type params, got: \`${typeOrTypes.format(
          "sighash"
        )}\``
      )
    }

    const expectedType = parameterType(type)
    const scopedType = checkScopedType(condition)

    if (scopedType !== expectedType) {
      const fieldReference = `'${type.name}'` || `at index ${index}`
      throw new Error(
        `Condition for field ${fieldReference} has wrong paramType \`${ParameterType[scopedType]}\` (expected: \`${ParameterType[expectedType]}\`)`
      )
    }
  })
}

/**
 * Returns `condition.paramType` if it is not `ParameterType.None`, otherwise returns the scoped param type of its children, if any.
 * Throws if the children have mixed scoped param types.
 * @param condition The condition to get the scoped param type of.
 * @returns the `ParameterType` the condition is applied to.
 */
const checkScopedType = (condition: PresetCondition): ParameterType => {
  if (condition.paramType === ParameterType.None) {
    if (!condition.children || condition.children.length === 0) {
      // e.g.: Operator.EtherWithinAllowance / Operator.CallWithinAllowance
      return ParameterType.None
    }

    const [first, ...rest] = condition.children
    const result = checkScopedType(first)

    // assert uniform children types
    if (rest.some((child) => checkScopedType(child) !== result)) {
      throw new Error(
        `Invalid \`${
          Operator[condition.operator]
        }\` condition: mixed children types`
      )
    }
    return result
  }

  return condition.paramType
}

const arrayDiff = (a: string[], b: string[]) => {
  const set = new Set(b)
  return a.filter((x) => !set.has(x))
}
