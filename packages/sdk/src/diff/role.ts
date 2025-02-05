import { invariant } from "@epic-web/invariant"
import { ZeroHash } from "ethers"
import { Annotation, Target } from "zodiac-roles-deployments"

import { diffMembers } from "./members"
import { diffTargets } from "./target"

import { Diff, merge } from "./helpers"

type RoleFragment = {
  key: string
  members?: `0x${string}`[]
  targets?: Target[]
  annotations?: Annotation[]
}

export function diffRoles({
  prev,
  next,
}: {
  prev?: RoleFragment[]
  next?: RoleFragment[]
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
  prev?: RoleFragment
  next?: RoleFragment
}): Diff {
  const roleKey = ensureRoleKey(prev, next)
  return merge(
    diffTargets({
      roleKey,
      prev: prev?.targets,
      next: next?.targets,
    }),
    diffMembers({
      roleKey,
      prev: prev?.members,
      next: next?.members,
    })
  )
}

function ensureRoleKey(prev?: RoleFragment, next?: RoleFragment) {
  const set = new Set([prev?.key, next?.key].filter(Boolean))

  invariant(set.size <= 1, "Invalid Role Comparison")

  return prev?.key || next?.key || ZeroHash
}
