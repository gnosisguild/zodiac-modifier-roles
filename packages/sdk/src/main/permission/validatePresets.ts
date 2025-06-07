import { coercePermission } from "./coercePermission"
import { mergePermissions } from "./mergePermissions"
import { permissionIncludes } from "./permissionIncludes"

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
  const targetPermissions: PermissionCoerced[] = input.map(coercePermission)

  sanityCheck(targetPermissions)
  for (const preset of presets) {
    preset && sanityCheck(preset.permissions)
  }

  const validated = presets
    .filter((p) => !!p)
    /*
     * find matches from the preset permissions into the onchain permission
     */
    .map((preset) => ({
      preset,
      matches: preset.permissions.map((presetPermission) =>
        targetPermissions.find((targetPermission) =>
          permissionIncludes(targetPermission, presetPermission)
        )
      ),
    }))
    /*
     * only presets for which every permission has a match are validated
     */
    .filter(({ matches }) => matches.every((m) => !!m))

  const mentioned = new Set(validated.flatMap(({ matches }) => matches))

  return {
    presets: validated.map(({ preset }) => preset),
    permissions: targetPermissions.filter((p) => !mentioned.has(p)),
  }
}

function sanityCheck(permissions: readonly PermissionCoerced[]) {
  const { violations } = mergePermissions(permissions)
  if (violations.length) {
    throw new Error(`Invalid Permissions:\n` + violations.join("\n\t"))
  }
}
