import { comparePermission } from "./comparePermission"
import { mergePermissions } from "./mergePermissions"

import { PermissionCoerced } from "./types"

/**
 * Filters and validates permission presets, returning two sets:
 * 1. Confirmed presets that are subsets of the provided permissions.
 * 2. Remaining permissions that are not referenced by any confirmed preset.
 */
export function validatePresets<
  T extends { permissions: PermissionCoerced[] },
>({
  presets,
  permissions,
}: {
  presets: readonly (T | null)[]
  permissions: readonly PermissionCoerced[]
}): {
  presets: T[]
  permissions: PermissionCoerced[]
} {
  /*
   * sanity check permissions and presets, will throw on unmergeable permissions
   */
  mergePermissions(permissions)
  for (const preset of presets) {
    preset && mergePermissions(preset.permissions)
  }

  const confirmedPresets = presets
    .filter((p) => !!p)
    .filter((preset) =>
      preset.permissions.every((p1) =>
        permissions.some((p2) => comparePermission(p1, p2))
      )
    )

  const confirmedPermissions = confirmedPresets
    .map((preset) => preset.permissions)
    .flat()

  const remainingPermissions = permissions.filter((p1) =>
    confirmedPermissions.every((p2) => !comparePermission(p1, p2))
  )

  return { presets: confirmedPresets, permissions: remainingPermissions }
}
