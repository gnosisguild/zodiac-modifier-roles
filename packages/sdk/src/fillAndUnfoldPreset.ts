import { keccak256, toUtf8Bytes } from "ethers/lib/utils"

import {
  Clearance,
  ExecutionOptions,
  RolePermissions,
  RolePreset,
  PresetScopeParam,
  Function,
  Target,
} from "./types"

// Takes a RolePreset, fills in the avatar placeholder, and returns a RolePermissions object
const fillAndUnfoldPreset = (
  preset: RolePreset,
  placeholderValues: Record<symbol, string>
): RolePermissions => {
  sanityCheck(preset)

  // fill in avatar placeholders and encode comparison values
  const { allowFunctions, allowTargets } = processParams(
    preset,
    placeholderValues
  )

  const fullyClearedTargets = allowTargets.map((target) => ({
    address: target.targetAddress,
    clearance: Clearance.Target,
    executionOptions: target.options || ExecutionOptions.None,
    functions: [],
  }))

  // our preset structures allows to specify multiple targets per function, so we need to unfold them
  const unfoldedFunctionTargets = Object.values(
    allowFunctions.reduce((targets, allowFunction) => {
      const functionItem: Function = {
        sighash:
          "sighash" in allowFunction
            ? allowFunction.sighash
            : functionSighash(allowFunction.signature),
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
  preset: RolePreset,
  placeholderValues: Record<symbol, string>
) => ({
  ...preset,
  allowFunctions: preset.allowFunctions.map((allowFunction) => ({
    ...allowFunction,
    params: Object.entries(allowFunction.params || {})
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
      .filter(Boolean as any as <T>(x: T | undefined) => x is T),
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
  const wildcardTargets = preset.allowTargets.map((f) => f.targetAddress)
  const scopedTargets = new Set(
    preset.allowFunctions.flatMap((af) => af.targetAddresses)
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

const assertNoDuplicateAllowFunction = (preset: RolePreset) => {
  const allowFunctions = preset.allowFunctions.flatMap((af) =>
    af.targetAddresses.map(
      (ta) =>
        `${ta}.${"sighash" in af ? af.sighash : functionSighash(af.signature)}`
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
