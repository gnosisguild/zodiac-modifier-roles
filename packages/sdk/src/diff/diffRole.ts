import { Annotation, Target } from "zodiac-roles-deployments"

import { diffMembers } from "./diffMember"
import { diffTargets } from "./diffTarget"

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
        roleKey,
        prev: prev?.find(({ key }) => key == roleKey),
        next: next?.find(({ key }) => key == roleKey),
      })
    )
    .reduce(merge, { minus: [], plus: [] })
}

export function diffRole({
  roleKey,
  prev,
  next,
}: {
  roleKey: string
  prev?: RoleFragment
  next?: RoleFragment
}): Diff {
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
