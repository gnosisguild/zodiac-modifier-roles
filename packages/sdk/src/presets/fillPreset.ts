import { defaultAbiCoder } from "ethers/lib/utils"

import { normalizeCondition } from "../conditions"
import {
  Clearance,
  Condition,
  ExecutionOptions,
  Operator,
  ParameterType,
  Target,
} from "../types"

import { mergeFunctionEntries } from "./mergeFunctionEntries"
import { AVATAR } from "./placeholders"
import {
  PlaceholderValues,
  PermissionPreset,
  Placeholder,
  ComparisonValue,
  PresetCondition,
  PresetFunctionCoerced,
} from "./types"
import { execOptions, allowEntryId, isScoped } from "./utils"

/**
 * Processes a RolePreset, filling in the placeholders and returning the final permissions
 * @param preset the RolePreset to process
 * @param placeholderValues a map of placeholder keys to the values they should be replaced with
 * @returns permissions as a list of allowed targets
 */
export const fillPreset = <P extends PermissionPreset>(
  preset: P,
  placeholderValues: PlaceholderValues<P>
): Target[] => {
  const mergedPreset = mergeFunctionEntries(preset)
  sanityCheck(mergedPreset)

  const placeholderLookupMap = makePlaceholderLookupMap(
    mergedPreset,
    placeholderValues
  )

  const { allow } = mergedPreset

  const fullyClearedTargets = allow
    .filter((entry) => !isScoped(entry))
    .map((entry) => ({
      address: entry.targetAddress.toLowerCase(),
      clearance: Clearance.Target,
      executionOptions: execOptions(entry),
      functions: [],
    }))

  const allowFunctionEntries = allow.filter(
    (entry) => "selector" in entry
  ) as PresetFunctionCoerced[]

  const functionScopedTargets = Object.entries(
    groupBy(allowFunctionEntries, (entry) => entry.targetAddress)
  ).map(([targetAddress, allowFunctions]) => ({
    address: targetAddress.toLowerCase(),
    clearance: Clearance.Function,
    executionOptions: ExecutionOptions.None,
    functions: allowFunctions.map((allowFunction) => {
      const { condition } = allowFunction
      return {
        selector: allowFunction.selector,
        executionOptions: execOptions(allowFunction),
        wildcarded: !condition,
        condition:
          condition &&
          normalizeCondition(
            fillConditionPlaceholders(condition, placeholderLookupMap)
          ),
      }
    }),
  }))

  return [...fullyClearedTargets, ...functionScopedTargets]
}

const makePlaceholderLookupMap = <P extends PermissionPreset>(
  preset: P,
  placeholderValues: PlaceholderValues<P>
) => {
  const map = new Map<Placeholder<any>, any>()
  for (const [key, placeholder] of Object.entries(preset.placeholders)) {
    const value = placeholderValues[key]
    if (value === undefined)
      throw new Error(`Missing placeholder value for ${key}`)
    map.set(placeholder, value)
  }
  return map
}

const fillConditionPlaceholders = (
  condition: PresetCondition,
  placeholderLookupMap: Map<Placeholder<any>, any>
): Condition => {
  // special handling for AVATAR placeholder: use EqualToAvatar operator
  // (This is an optimization to avoid having to encode the avatar address making the condition data more broadly shareable)
  if (
    condition.paramType === ParameterType.Static &&
    condition.compValue instanceof Placeholder &&
    condition.compValue.identity === AVATAR
  ) {
    return {
      paramType: ParameterType.Static,
      operator: Operator.EqualToAvatar,
    }
  }

  return {
    paramType: condition.paramType,
    operator: condition.operator,
    compValue: fillPlaceholder(condition.compValue, placeholderLookupMap),
    children: condition.children?.map((child) =>
      fillConditionPlaceholders(child, placeholderLookupMap)
    ),
  }
}

const fillPlaceholder = (
  valueOrPlaceholder: ComparisonValue | undefined,
  placeholderLookupMap: Map<Placeholder<any>, any>
) => {
  if (valueOrPlaceholder === undefined) return undefined

  if (valueOrPlaceholder instanceof Placeholder) {
    const value = placeholderLookupMap.get(valueOrPlaceholder.identity)
    if (value === undefined) {
      throw new Error(
        `Placeholder "${valueOrPlaceholder.name}" is not registered in the preset's placeholders object`
      )
    }
    return defaultAbiCoder.encode([valueOrPlaceholder.type], [value])
  }

  return valueOrPlaceholder
}

const sanityCheck = (preset: PermissionPreset) => {
  assertNoWildcardScopedIntersection(preset)
  assertNoDuplicateAllowFunction(preset)
}

const assertNoWildcardScopedIntersection = (preset: PermissionPreset) => {
  const wildcardTargets = preset.allow
    .filter((entry) => !isScoped(entry))
    .map((entry) => entry.targetAddress)

  const scopedTargets = new Set(
    preset.allow.filter(isScoped).map((entry) => entry.targetAddress)
  )

  const intersection = [
    ...new Set(wildcardTargets.filter((x) => scopedTargets.has(x))),
  ]
  if (intersection.length > 0) {
    throw new Error(
      `An address can either be fully allowed or scoped to selected functions. The following addresses are both: ${intersection.join(
        ", "
      )}`
    )
  }
}

const assertNoDuplicateAllowFunction = (preset: PermissionPreset) => {
  const allowFunctions = preset.allow.filter(isScoped).map(allowEntryId)

  const counts = allowFunctions.reduce(
    (result, item) => ({ ...result, [item]: (result[item] || 0) + 1 }),
    {} as Record<string, number>
  )
  const duplicates = [
    ...new Set(allowFunctions.filter((item) => counts[item] > 1)),
  ]

  if (duplicates.length > 0) {
    throw new Error(
      `The following functions appear multiple times and cannot be merged: ${duplicates.join(
        ", "
      )}`
    )
  }
}

const groupBy = <T, K extends keyof any>(arr: T[], key: (i: T) => K) =>
  arr.reduce((groups, item) => {
    ;(groups[key(item)] ||= []).push(item)
    return groups
  }, {} as Record<K, T[]>)
