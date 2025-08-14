import { Role, Allowance } from "zodiac-roles-deployments"

export function spreadPartial(
  prev: { roles: Role[]; allowances: Allowance[] } | undefined | null,
  partial: {
    roles?: Role[] | Record<string, Role>
    allowances?: Allowance[] | Record<string, Allowance>
  }
) {
  let roles: Role[] = prev?.roles || []
  let allowances: Allowance[] = prev?.allowances || []

  if (Array.isArray(partial.roles)) {
    roles = partial.roles!
  } else if (partial.roles) {
    const rolesMap = new Map(roles.map((r) => [r.key, r]))
    for (const [key, role] of Object.entries(
      partial.roles as Record<string, Role>
    )) {
      rolesMap.set(key as `0x${string}`, role)
    }

    roles = Array.from(rolesMap.values())
  }

  if (Array.isArray(partial.allowances)) {
    // Array replaces entirely
    allowances = partial.allowances!
  } else if (partial.allowances) {
    // Map: merge with existing, updating only specified keys
    const allowancesMap = new Map(allowances.map((a) => [a.key, a]))
    for (const [key, allowance] of Object.entries(
      partial.allowances as Record<string, Allowance>
    )) {
      allowancesMap.set(key as `0x${string}`, allowance)
    }

    allowances = Array.from(allowancesMap.values())
  }

  return {
    roles,
    allowances,
  }
}
