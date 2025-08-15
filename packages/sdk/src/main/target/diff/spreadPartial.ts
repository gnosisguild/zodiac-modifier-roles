import { Role, Allowance } from "zodiac-roles-deployments"

export function spreadPartial(
  prev: { roles: Role[]; allowances: Allowance[] } | undefined | null,
  partial: {
    roles?: Role[] | Record<string, Role | null>
    allowances?: Allowance[] | Record<string, Allowance | null>
  }
) {
  const merge = <T extends { key: `0x${string}` }>(
    prev: T[],
    next?: T[] | Record<string, T | null>
  ): T[] => {
    if (!next) return prev
    if (Array.isArray(next)) return next

    const map = new Map(prev.map((item) => [item.key, item]))
    Object.entries(next).forEach(([key, value]) => {
      if (value === null) {
        map.delete(key as `0x${string}`)
      } else {
        map.set(key as `0x${string}`, value)
      }
    })
    return Array.from(map.values())
  }

  return {
    roles: merge(prev?.roles || [], partial.roles),
    allowances: merge(prev?.allowances || [], partial.allowances),
  }
}
