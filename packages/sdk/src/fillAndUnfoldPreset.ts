import { keccak256, toUtf8Bytes } from "ethers/lib/utils"

import translateErc20Approvals from "./translateErc20Approvals"
import {
  Clearance,
  ExecutionOptions,
  RolePermissions,
  RolePreset,
  PresetScopeParam,
  Function,
  Target,
  CoercedRolePreset,
  CoercedPresetAllowEntry,
  PresetFunction,
} from "./types"

// Takes a RolePreset, fills in the avatar placeholder, and returns a RolePermissions object
const fillAndUnfoldPreset = (
  preset: RolePreset,
  placeholderValues: Record<symbol, string>
): RolePermissions => {
  const coercedPreset = translateErc20Approvals(preset)

  sanityCheck(coercedPreset)

  // fill in avatar placeholders and encode comparison values
  const { allow } = processParams(coercedPreset, placeholderValues)

  const fullyClearedTargets = allow
    .filter((entry) => !isScoped(entry))
    .flatMap((entry) =>
      entry.targetAddresses.map((targetAddress) => ({
        address: targetAddress,
        clearance: Clearance.Target,
        executionOptions: entry.options || ExecutionOptions.None,
        functions: [],
      }))
    )

  // our preset structures allows to specify multiple targets per function, so we need to unfold them
  const unfoldedFunctionTargets = Object.values(
    allow.filter(isScoped).reduce((targets, allowFunction) => {
      let sighash = "sighash" in allowFunction && allowFunction.sighash
      if (!sighash)
        sighash =
          "signature" in allowFunction &&
          functionSighash(allowFunction.signature)
      if (!sighash) throw new Error("invariant violation")

      const functionItem: Function = {
        sighash,
        executionOptions: allowFunction.options || ExecutionOptions.None,
        wildcarded: allowFunction.params.length === 0,
        parameters: allowFunction.params,
      }

      allowFunction.targetAddresses.forEach((targetAddress) => {
        targets[targetAddress] = targets[targetAddress] || {
          address: targetAddress,
          clearance: Clearance.Function,
          executionOptions: allowFunction.options || ExecutionOptions.None,
          functions: [],
        }

        if (
          targets[targetAddress].functions.some(
            (f) => f.sighash === functionItem.sighash
          )
        ) {
          throw new Error(
            `Duplicate function ${functionItem.sighash} for target ${targetAddress}`
          )
        }

        targets[targetAddress].functions.push(functionItem)
      })

      return targets
    }, {} as Record<string, Target>)
  )

  return {
    targets: [...fullyClearedTargets, ...unfoldedFunctionTargets],
  }
}

export default fillAndUnfoldPreset

const functionSighash = (signature: string): string =>
  keccak256(toUtf8Bytes(signature)).substring(0, 10)

// Process the params, filling in the placeholder values and encoding the values
const processParams = (
  preset: CoercedRolePreset,
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

const sanityCheck = (preset: CoercedRolePreset) => {
  assertNoWildcardScopedIntersection(preset)
  assertNoDuplicateAllowFunction(preset)
}

const assertNoWildcardScopedIntersection = (preset: CoercedRolePreset) => {
  const wildcardTargets = preset.allow.flatMap((entry) =>
    !isScoped(entry) ? entry.targetAddresses : []
  )
  const scopedTargets = new Set(
    preset.allow.filter(isScoped).flatMap((af) => af.targetAddresses)
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

const isScoped = (entry: CoercedPresetAllowEntry): entry is PresetFunction =>
  "sighash" in entry || "signature" in entry

const assertNoDuplicateAllowFunction = (preset: CoercedRolePreset) => {
  const allowFunctions = preset.allow
    .filter(isScoped)
    .flatMap((af) =>
      af.targetAddresses.map(
        (ta) =>
          `${ta}.${
            "sighash" in af ? af.sighash : functionSighash(af.signature)
          }`
      )
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
