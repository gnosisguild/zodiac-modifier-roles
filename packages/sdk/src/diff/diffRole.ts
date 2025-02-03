import { invariant } from "@epic-web/invariant"

import { Role } from "zodiac-roles-deployments"

import diffTarget from "./diffTarget"
import diffMembers from "./diffMembers"
import { Diff, merge } from "./helpers"

type RolePayload = Omit<Role, "lastUpdate">

export default function diffRole({
  roleKey,
  prev,
  next,
}: {
  roleKey: string
  prev?: RolePayload
  next?: RolePayload
}): Diff {
  invariant(!prev || prev.key == roleKey, "wrong roleKey")
  invariant(!next || next.key == roleKey, "wrong roleKey")

  const targetAddresses = Array.from(
    new Set([
      ...(prev?.targets.map((t) => t.address) || []),
      ...(next?.targets.map((t) => t.address) || []),
    ])
  )

  let result: Diff = { minus: [], plus: [] }

  const targets = targetAddresses
    .map((targetAddress) =>
      diffTarget({
        roleKey,
        targetAddress,
        prev: prev?.targets.find((t) => t.address == targetAddress),
        next: prev?.targets.find((t) => t.address == targetAddress),
      })
    )
    .reduce((result, diff) => merge(result, diff), result)

  const members = diffMembers({
    roleKey,
    prev: prev?.members,
    next: next?.members,
  })

  return merge(targets, members)
}
