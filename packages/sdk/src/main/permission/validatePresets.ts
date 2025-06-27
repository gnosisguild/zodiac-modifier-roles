import { Target } from "zodiac-roles-deployments"

import { subtractTarget } from "../target/subtractTarget"

import { confirmPreset } from "./confirmPreset"
import { mergePermissions } from "./mergePermissions"
import { processPermissions } from "./processPermissions"
import { reconstructPermissions } from "./reconstructPermissions"

import { PermissionCoerced } from "./types"

/**
 * Filters and validates permission presets, returning two sets:
 * 1. Confirmed presets that are fully included onchain
 * 2. Remaining permissions that are not covered by any preset.
 */
export function validatePresets<
  T extends { permissions: PermissionCoerced[] },
>({
  targets,
  presets,
}: {
  targets: readonly Target[]
  presets: readonly (T | null)[]
}): {
  presets: T[]
  permissions: PermissionCoerced[]
} {
  for (const preset of presets) {
    preset && sanityCheck(preset.permissions)
  }

  const confirmedPresets = presets.filter(
    (preset) => !!preset && confirmPreset({ targets, preset })
  ) as T[]

  const confirmedPermissions = confirmedPresets.flatMap((p) => p.permissions)
  sanityCheck(confirmedPermissions)

  const { targets: targetsFromPresets } =
    processPermissions(confirmedPermissions)

  const subtractedTargets = targets
    .map((target) => {
      const targetFromPreset = targetsFromPresets.find(
        ({ address }) => address == target.address
      )

      // if there's a target to subtract do it, otherwise
      // return current
      return targetFromPreset
        ? subtractTarget(target, targetFromPreset)
        : target
    })
    // undefined means the target was fully covered
    .filter((t) => !!t)

  return {
    presets: confirmedPresets,
    permissions: reconstructPermissions(subtractedTargets),
  }
}

function sanityCheck(permissions: readonly PermissionCoerced[]) {
  const { violations } = mergePermissions(permissions)
  if (violations.length) {
    throw new Error(`Invalid Permissions:\n` + violations.join("\n\t"))
  }
}
