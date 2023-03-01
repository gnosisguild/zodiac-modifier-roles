import { keccak256, toUtf8Bytes } from "ethers/lib/utils"

import {
  Clearance,
  ExecutionOptions,
  RolePermissions,
  Comparison,
} from "../types"

import { execOptions } from "./execOptions"
import { solidityPackPadded } from "./scopeParam"
import {
  PlaceholderValues,
  RolePreset,
  PresetScopeParam,
  PresetFunction,
  PresetAllowEntry,
  Placeholder,
  ComparisonValue,
} from "./types"

// Takes a RolePreset, fills in the placeholders, and returns a RolePermissions object
const fillPreset = <P extends RolePreset>(
  preset: P,
  placeholderValues: PlaceholderValues<P>
): RolePermissions => {
  preset = mergeFunctionEntries(preset) as P
  sanityCheck(preset)

  const placeholderLookupMap = makePlaceholderLookupMap(
    preset,
    placeholderValues
  )

  const fullyClearedTargets = preset.allow
    .filter((entry) => !isScoped(entry))
    .map((entry) => ({
      address: entry.targetAddress.toLowerCase(),
      clearance: Clearance.Target,
      executionOptions: execOptions(entry),
      functions: [],
    }))

  const functionTargets = Object.entries(
    groupBy(preset.allow.filter(isScoped), (entry) =>
      entry.targetAddress.toLowerCase()
    )
  ).map(([targetAddress, allowFunctions]) => ({
    address: targetAddress.toLowerCase(),
    clearance: Clearance.Function,
    executionOptions: ExecutionOptions.None,
    functions: allowFunctions.map((allowFunction) => {
      let sighash = "sighash" in allowFunction && allowFunction.sighash
      if (!sighash)
        sighash =
          "signature" in allowFunction &&
          functionSighash(allowFunction.signature)
      if (!sighash) throw new Error("invariant violation")

      const parameters = processParams(
        allowFunction.params,
        placeholderLookupMap
      )

      return {
        sighash,
        executionOptions: execOptions(allowFunction),
        wildcarded: parameters.length === 0,
        parameters,
      }
    }),
  }))

  return {
    targets: [...fullyClearedTargets, ...functionTargets],
  }
}

export default fillPreset

const functionSighash = (signature: string): string =>
  keccak256(toUtf8Bytes(signature)).substring(0, 10)

const makePlaceholderLookupMap = <P extends RolePreset>(
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

// Process the params, filling in the placeholder values and encoding the values
const processParams = (
  params:
    | (PresetScopeParam | undefined)[]
    | Record<number, PresetScopeParam>
    | undefined,
  placeholderLookupMap: Map<Placeholder<any>, any>
) => {
  if (!params) return []

  return Object.entries(params || {})
    .map(
      ([key, param]) =>
        param && {
          index: parseInt(key),
          type: param.type,
          comparison: param.comparison,
          comparisonValue: fillPlaceholderValues(
            param.value,
            placeholderLookupMap
          ),
        }
    )
    .filter(Boolean as any as <T>(x: T | undefined) => x is T)
}

const fillPlaceholderValues = (
  value: PresetScopeParam["value"],
  placeholderLookupMap: Map<Placeholder<any>, any>
) => {
  const mapValue = (valueOrPlaceholder: ComparisonValue) => {
    if (valueOrPlaceholder instanceof Placeholder) {
      const value = placeholderLookupMap.get(valueOrPlaceholder.identity)
      if (value === undefined) {
        throw new Error(
          `Placeholder "${valueOrPlaceholder.name}" is not registered in the preset's placeholders object`
        )
      }
      return solidityPackPadded(valueOrPlaceholder.type, value)
    }

    return valueOrPlaceholder
  }

  return Array.isArray(value) ? value.map(mapValue) : [mapValue(value)]
}

const sanityCheck = (preset: RolePreset) => {
  assertNoWildcardScopedIntersection(preset)
  assertNoDuplicateAllowFunction(preset)
}

const assertNoWildcardScopedIntersection = (preset: RolePreset) => {
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
      `The following addresses appear under allowTargets and allowFunctions: ${intersection.join(
        ", "
      )}`
    )
  }
}

const isScoped = (entry: PresetAllowEntry): entry is PresetFunction =>
  "sighash" in entry || "signature" in entry

const assertNoDuplicateAllowFunction = (preset: RolePreset) => {
  const allowFunctions = preset.allow.filter(isScoped).map(functionId)

  const counts = allowFunctions.reduce(
    (result, item) => ({ ...result, [item]: (result[item] || 0) + 1 }),
    {} as Record<string, number>
  )
  const duplicates = [
    ...new Set(allowFunctions.filter((item) => counts[item] > 1)),
  ]

  if (duplicates.length > 0) {
    throw new Error(
      `The following functions appear multiple times under allowFunctions: ${duplicates.join(
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

const functionId = (entry: PresetFunction) =>
  `${entry.targetAddress.toLowerCase()}.${
    "sighash" in entry ? entry.sighash : functionSighash(entry.signature)
  }`

const mergeFunctionEntries = (preset: RolePreset) => ({
  ...preset,
  allow: preset.allow.reduce((result, entry) => {
    if (!isScoped(entry)) {
      result.push(entry)
      return result
    }

    const matchingEntry = result
      .filter(isScoped)
      .find((existingEntry) => functionId(existingEntry) === functionId(entry))
    if (!matchingEntry) {
      result.push(entry)
      return result
    }

    if (
      !!matchingEntry.send !== !!entry.send ||
      !!matchingEntry.delegatecall !== !!entry.delegatecall
    ) {
      // we don't merge if execution options are different
      result.push(entry)
      return result
    }

    const matchingEntryParams = Object.entries(
      matchingEntry.params || {}
    ).filter(([, param]) => param !== undefined)
    const params = Object.entries(entry.params || {}).filter(
      ([, param]) => param !== undefined
    )

    if (
      !arraysEqual(
        matchingEntryParams.map(([key]) => key),
        params.map(([key]) => key)
      )
    ) {
      // we don't merge if the entries set constraints on different parameters
      result.push(entry)
      return result
    }

    const mergedParams: Record<number, PresetScopeParam> = {}
    for (const [key, param] of params) {
      const [, matchingEntryParam] =
        matchingEntryParams.find(([matchingKey]) => matchingKey === key) || []
      if (!matchingEntryParam || !param) throw new Error("invariant violation")

      let mergedParam: PresetScopeParam
      try {
        mergedParam = mergeFunctionParam(matchingEntryParam, param)
      } catch (e) {
        // we don't merge entries if the params cannot be merged
        result.push(entry)
        return result
      }

      mergedParams[parseInt(key)] = mergedParam
    }

    // update existing entry to the set of merged params
    matchingEntry.params = mergedParams
    return result
  }, [] as PresetAllowEntry[]),
})

const mergeFunctionParam = (a: PresetScopeParam, b: PresetScopeParam) => {
  if (a.type !== b.type) {
    throw new Error(
      `Cannot merge parameters of different types: ${a.type} and ${b.type}`
    )
  }

  const MERGEABLE_COMPARISONS = [Comparison.EqualTo, Comparison.OneOf]
  if (!MERGEABLE_COMPARISONS.includes(a.comparison)) {
    throw new Error(`Cannot merge parameters with comparison ${a.comparison}`)
  }
  if (!MERGEABLE_COMPARISONS.includes(b.comparison)) {
    throw new Error(`Cannot merge parameters with comparison ${b.comparison}`)
  }

  const aValues = Array.isArray(a.value) ? a.value : [a.value]
  const bValues = Array.isArray(b.value) ? b.value : [b.value]
  const mergedValues = [...new Set([...aValues, ...bValues])]

  return {
    type: a.type,
    comparison:
      mergedValues.length === 1 ? Comparison.EqualTo : Comparison.OneOf,
    value: mergedValues.length === 1 ? mergedValues[0] : mergedValues,
  }
}

const arraysEqual = (a: string[], b: string[]) =>
  a.length === b.length && a.every((aEntry) => b.includes(aEntry))
