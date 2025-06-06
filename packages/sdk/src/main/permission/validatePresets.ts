import { coercePermission } from "./coercePermission"
import { mergePermissions } from "./mergePermissions"
import { permissionEquals } from "./permissionEquals"

import { Permission, PermissionCoerced } from "./types"

/**
 * Filters and validates permission presets, returning two sets:
 * 1. Confirmed presets that are subsets of the provided permissions.
 * 2. Remaining permissions that are not referenced by any confirmed preset.
 */
export function validatePresets<T extends { permissions: Permission[] }>({
  presets,
  permissions: input,
}: {
  presets: readonly (T | null)[]
  permissions: readonly Permission[]
}): {
  presets: T[]
  permissions: PermissionCoerced[]
} {
  const permissions: PermissionCoerced[] = input.map(coercePermission)
  /*
   * sanity check permissions and presets, will throw on unmergeable permissions
   */
  sanityCheck(permissions)
  for (const preset of presets) {
    preset && sanityCheck(preset.permissions)
  }

  const confirmedPresets = presets
    .filter((p) => !!p)
    .filter((preset) =>
      preset.permissions.every((p1) =>
        permissions.some((p2) => permissionEquals(p1, p2))
      )
    )

  const confirmedPermissions = confirmedPresets
    .map((preset) => preset.permissions)
    .flat()

  const remainingPermissions = permissions.filter((p1) =>
    confirmedPermissions.every((p2) => !permissionEquals(p1, p2))
  )

  return { presets: confirmedPresets, permissions: remainingPermissions }
}

function sanityCheck(permissions: readonly PermissionCoerced[]) {
  const { violations } = mergePermissions(permissions)
  if (violations.length) {
    throw new Error(`Invalid Permissions:\n` + violations.join("\n\t"))
  }
}
