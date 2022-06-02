import { defaultAbiCoder } from "ethers/lib/utils"
import { AVATAR_ADDRESS_PLACEHOLDER } from "./placeholders"
import { RolePermissions, RolePreset, ScopeParam } from "./types"

export const getPermissionsForPreset = (
  preset: RolePreset,
  avatar: string
): RolePermissions => {
  sanityCheck(preset)
  const filledPreset = fillPlaceholders(preset, avatar)
}

const fillPlaceholders = (preset: RolePreset, avatarAddress: string) => ({
  ...preset,
  allowFunctions: preset.allowFunctions.map((allowFunction) => ({
    ...allowFunction,
    params: (allowFunction.params || []).map(
      (param) =>
        param && {
          ...param,
          value: fillPlaceholdersValue(param.value, avatarAddress),
        }
    ),
  })),
})

const fillPlaceholdersValue = (
  value: ScopeParam["value"],
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

type RolesPresetFilled = ReturnType<typeof fillPlaceholders>

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
    af.targetAddresses.map((ta) => `${ta}.${af.functionSig}`)
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
