import { getAddress } from "ethers"
import { Diff } from "./helpers"

export function diffMembers({
  roleKey,
  prev,
  next,
}: {
  roleKey: string
  prev?: `0x${string}`[]
  next?: `0x${string}`[]
}): Diff {
  prev = (prev || []).map((member) => getAddress(member) as `0x${string}`)
  next = (next || []).map((member) => getAddress(member) as `0x${string}`)

  const toRemove = prev.filter((member) => !next.includes(member))
  const toAdd = next.filter((member) => !prev.includes(member))

  return {
    minus: toRemove.map((member) => ({
      call: "assignRoles",
      roleKey,
      member,
      join: false,
    })),
    plus: toAdd.map((member) => ({
      call: "assignRoles",
      roleKey,
      member,
      join: true,
    })),
  }
}
