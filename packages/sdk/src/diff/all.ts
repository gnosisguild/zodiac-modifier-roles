import { Allowance, Role } from "zodiac-roles-deployments"
import { diffRoles } from "./role"
import { diffAllowances } from "./allowances"

import { Diff, merge } from "./helpers"

export function diffAll({
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
