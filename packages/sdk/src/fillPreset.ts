import { keccak256, toUtf8Bytes } from "ethers/lib/utils"

import {
  Clearance,
  ExecutionOptions,
  RolePermissions,
  RolePreset,
  PresetScopeParam,
  PresetFunction,
  PresetAllowEntry,
} from "./types"

// Takes a RolePreset, fills in the avatar placeholder, and returns a RolePermissions object
const fillPreset = (
  preset: RolePreset,
  placeholderValues: Record<symbol, string>
): RolePermissions => {
  // TODO merge oneOf params in duplicate function entries
  sanityCheck(preset)

  // fill in avatar placeholders and encode comparison values
  const { allow } = processParams(preset, placeholderValues)

  const fullyClearedTargets = allow
    .filter((entry) => !isScoped(entry))
    .map((entry) => ({
      address: entry.targetAddress,
      clearance: Clearance.Target,
      executionOptions: entry.options || ExecutionOptions.None,
      functions: [],
    }))

  const functionTargets = Object.entries(
    groupBy(allow.filter(isScoped), (entry) => entry.targetAddress)
  ).map(([targetAddress, allowFunctions]) => ({
    address: targetAddress,
    clearance: Clearance.Function,
    executionOptions: ExecutionOptions.None,
    functions: allowFunctions.map((allowFunction) => {
      let sighash = "sighash" in allowFunction && allowFunction.sighash
      if (!sighash)
        sighash =
          "signature" in allowFunction &&
          functionSighash(allowFunction.signature)
      if (!sighash) throw new Error("invariant violation")

      return {
        sighash,
        executionOptions: allowFunction.options || ExecutionOptions.None,
        wildcarded: allowFunction.params.length === 0,
        parameters: allowFunction.params,
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

// Process the params, filling in the placeholder values and encoding the values
const processParams = (
  preset: RolePreset,
  placeholderValues: Record<symbol, string>
) => ({
  ...preset,
  allow: preset.allow.map((entry) => ({
    ...entry,
    params:
      "params" in entry
        ? Object.entries(entry.params || {})
            .map(
              ([key, param]) =>
                param && {
                  index: parseInt(key),
                  type: param.type,
                  comparison: param.comparison,
                  comparisonValue: fillPlaceholderValues(
                    param.value,
                    placeholderValues
                  ),
                }
            )
            .filter(Boolean as any as <T>(x: T | undefined) => x is T)
        : [],
  })),
})

const fillPlaceholderValues = (
  value: PresetScopeParam["value"],
  placeholderValues: Record<symbol, string>
) => {
  const mapValue = (value: PresetScopeParam["value"]) => {
    if (typeof value === "symbol") {
      if (!placeholderValues[value]) {
        throw new Error(`Missing placeholder value for ${String(value)}`)
      }
      return placeholderValues[value]
    } else {
      return value as string
    }
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
  const allowFunctions = preset.allow
    .filter(isScoped)
    .map(
      (af) =>
        `${af.targetAddress}.${
          "sighash" in af ? af.sighash : functionSighash(af.signature)
        }`
    )

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
