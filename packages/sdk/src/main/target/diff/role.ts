import { ZeroHash } from "ethers"
import { Annotation, Target } from "zodiac-roles-deployments"

import { diffAnnotations } from "./annotations"
import { diffMembers } from "./members"
import { diffTargets } from "./target"

import { Diff, merge } from "./helpers"

type RoleFragment = {
  key: `0x${string}`
  members?: `0x${string}`[]
  targets?: Target[]
  annotations?: Annotation[]
}

export function diffRoles({
  prev,
  next,
}: {
  prev: RoleFragment[] | undefined | null
  next: RoleFragment[] | undefined | null
}): Diff {
  const roleKeys = Array.from(
    new Set([
      ...(prev?.map(({ key }) => key) || []),
      ...(next?.map(({ key }) => key) || []),
    ])
  )

  return roleKeys
    .map((roleKey) =>
      diffRole({
        prev: prev?.find(({ key }) => key == roleKey),
        next: next?.find(({ key }) => key == roleKey),
      })
    )
    .reduce(merge, { minus: [], plus: [] })
}

export function diffRole({
  prev,
  next,
}: {
  prev: RoleFragment | undefined | null
  next: RoleFragment | undefined | null
}): Diff {
  const roleKey = ensureRoleKey(prev, next)

  return [
    diffMembers({
      roleKey,
      prev: prev?.members,
      next: next?.members,
    }),
    diffTargets({
      roleKey,
      prev: prev?.targets,
      next: next?.targets,
    }),
    diffAnnotations({
      roleKey,
      prev: prev?.annotations,
      next: next?.annotations,
    }),
  ].reduce((p, n) => merge(p, n), { minus: [], plus: [] })
}

function ensureRoleKey(
  prev: RoleFragment | undefined | null,
  next: RoleFragment | undefined | null
) {
  const set = new Set([prev?.key, next?.key].filter(Boolean))

  if (set.size >= 2) {
    throw new Error(`Not the same Role: ${prev?.key} and ${next?.key}`)
  }

  return (prev?.key || next?.key || ZeroHash) as `0x${string}`
}
