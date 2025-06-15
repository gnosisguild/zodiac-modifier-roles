import { Target } from "zodiac-roles-deployments"
import { mergePermissions } from "./mergePermissions"
import { permissionIncludes } from "./permissionIncludes"
import { reconstructPermissions } from "./reconstructPermissions"

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
  targets,
}: {
  presets: readonly (T | null)[]
  targets: readonly Target[]
}): {
  presets: T[]
  permissions: PermissionCoerced[]
} {
  for (const preset of presets) {
    preset && sanityCheck(preset.permissions)
  }

  const permissions = reconstructPermissions(targets)

  const validated = presets
    .filter((p) => !!p)
    /*
     * find matches from the preset permissions into the onchain permission
     */
    .map((preset) => ({
      preset,
      matches: preset.permissions.map((b) =>
        permissions.find((a) => permissionIncludes(a, b))
      ),
    }))
    /*
     * only presets for which every permission has a match are validated
     */
    .filter(({ matches }) => matches.every((m) => !!m))

  const mentioned = new Set(validated.flatMap(({ matches }) => matches))

  return {
    presets: validated.map(({ preset }) => preset),
    permissions: permissions.filter((p) => !mentioned.has(p)),
  }
}

function sanityCheck(permissions: readonly PermissionCoerced[]) {
  const { violations } = mergePermissions(permissions)
  if (violations.length) {
    throw new Error(`Invalid Permissions:\n` + violations.join("\n\t"))
  }
}
