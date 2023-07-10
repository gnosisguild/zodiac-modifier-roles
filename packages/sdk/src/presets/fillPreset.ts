import { normalizeCondition } from "../conditions"
import { Clearance, ExecutionOptions, Target } from "../types"

import { mergeFunctionEntries } from "./mergeFunctionEntries"
import { Preset, PresetFunctionCoerced } from "./types"
import { execOptions, allowEntryId, isScoped } from "./utils"

/**
 * Processes a RolePreset, filling in the placeholders and returning the final permissions
 * @param preset the RolePreset to process
 * @param placeholderValues a map of placeholder keys to the values they should be replaced with
 * @returns permissions as a list of allowed targets
 */
export const fillPreset = <P extends Preset>(preset: P): Target[] => {
  const mergedPreset = mergeFunctionEntries(preset)
  sanityCheck(mergedPreset)

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
        condition: condition && normalizeCondition(condition),
      }
    }),
  }))

  return [...fullyClearedTargets, ...functionScopedTargets]
}

const sanityCheck = (preset: Preset) => {
  assertNoWildcardScopedIntersection(preset)
  assertNoDuplicateAllowFunction(preset)
}

const assertNoWildcardScopedIntersection = (preset: Preset) => {
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

const assertNoDuplicateAllowFunction = (preset: Preset) => {
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
