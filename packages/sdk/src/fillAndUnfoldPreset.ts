import { defaultAbiCoder, keccak256, toUtf8Bytes } from "ethers/lib/utils"
import { AVATAR_ADDRESS_PLACEHOLDER } from "./placeholders"
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
  avatar: string
): RolePermissions => {
  sanityCheck(preset)

  // fill in avatar placeholders and encode comparison values
  const { allowFunctions, allowTargets } = processParams(preset, avatar)

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

// Process the params, filling in the avatar placeholder and encoding the values
const processParams = (preset: RolePreset, avatar: string) => ({
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
            comparisonValue: asArray(
              fillPlaceholdersValue(param.value, avatar)
            ),
          }
      )
      .filter(Boolean as any as <T>(x: T | undefined) => x is T),
  })),
})

const fillPlaceholdersValue = (
  value: PresetScopeParam["value"],
  avatarAddress: string
) => {
  const encodedAddress = defaultAbiCoder.encode(["address"], [avatarAddress])

  if (value === AVATAR_ADDRESS_PLACEHOLDER) {
    return encodedAddress
  }
  if (Array.isArray(value)) {
    return value.map((entry) =>
      entry === AVATAR_ADDRESS_PLACEHOLDER ? encodedAddress : entry
    )
  }

  return value
}

const asArray = (value: string | string[]): string[] =>
  typeof value === "string" ? [value] : value

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
