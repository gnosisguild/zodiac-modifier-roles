import { Target } from "zodiac-roles-deployments"
import { mergePermissions } from "./mergePermissions"

import { targetIncludes } from "../target/targetIncludes"
import { processPermissions } from "./processPermissions"
import { PermissionCoerced } from "./types"

/**
 * Checks if all preset permissions are included in the given targets.
 *
 * @param targets - Current target permissions (from on-chain)
 * @param preset - Preset permissions to verify
 * @returns true if preset is fully covered by targets
 * @throws if preset permissions can't be merged
 */
export function confirmPreset({
  targets,
  preset,
}: {
  targets: readonly Target[]
  preset: { permissions: PermissionCoerced[] }
}): boolean {
  sanityCheck(preset.permissions)

  const { targets: targetsFromPreset } = processPermissions(preset.permissions)

  return targetsFromPreset.every((targetFromPreset) => {
    const target = targets.find(
      (target) => target.address === targetFromPreset.address
    )

    // was it found onchain?
    if (!target) return false

    // is it included?
    return targetIncludes(target, targetFromPreset)
  })
}

function sanityCheck(permissions: readonly PermissionCoerced[]) {
  const { violations } = mergePermissions(permissions)
  if (violations.length) {
    throw new Error(`Invalid Permissions:\n` + violations.join("\n\t"))
  }
}
