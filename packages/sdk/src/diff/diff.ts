import { Allowance, Role } from "zodiac-roles-deployments"
import { diffRoles } from "./diffRole"
import { diffAllowances } from "./diffAllowances"

import { Diff, merge } from "./helpers"

export function diff({
  prev,
  next,
}: {
  prev?: { roles: Role[]; allowances: Allowance[] }
  next?: { roles: Role[]; allowances: Allowance[] }
}): Diff {
  return merge(
    diffRoles({
      prev: prev?.roles,
      next: next?.roles,
    }),
    diffAllowances({
      prev: prev?.allowances,
      next: next?.allowances,
    })
  )
}
