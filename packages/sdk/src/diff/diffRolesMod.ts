import { Allowance, Role } from "zodiac-roles-deployments"

import diffAllowances from "./diffAllowances"
import diffRole from "./diffRole"

import { Call } from "../calls"

type Diff = {
  minus: Call[]
  plus: Call[]
}

export default function diffRolesMod({
  prev,
  next,
}: {
  prev?: { roles: Role[]; allowances: Allowance[] }
  next?: { roles: Role[]; allowances: Allowance[] }
}): Diff {
  const allRoleKeys = Array.from(
    new Set([
      ...(prev?.roles.map((role) => role.key) || []),
      ...(next?.roles.map((role) => role.key) || []),
    ])
  )

  const targets = allRoleKeys
    .map((roleKey) =>
      diffRole({
        roleKey,
        prev: prev?.roles.find((t) => t.key == roleKey),
        next: prev?.roles.find((t) => t.key == roleKey),
      })
    )
    .reduce((result, diff) => merge(result, diff), { minus: [], plus: [] })

  const allowances = diffAllowances({
    prev: prev?.allowances,
    next: next?.allowances,
  })

  return merge(targets, allowances)
}

function merge(diff1: Diff, diff2: Diff): Diff {
  return {
    minus: [...diff1.minus, ...diff2.minus],
    plus: [...diff1.plus, ...diff2.plus],
  }
}
