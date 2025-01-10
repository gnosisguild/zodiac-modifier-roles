import { DiffFlag } from "@/components/permissions/types"

export const diffMembers = (left: string[], right: string[]) => {
  const leftSet = new Set(left.map((member) => member.toLowerCase()))
  const rightSet = new Set(right.map((member) => member.toLowerCase()))

  const removeEntries = [...leftSet]
    .filter((member) => !rightSet.has(member))
    .map((member) => [member, DiffFlag.Removed] as const)

  const addEntries = [...rightSet]
    .filter((member) => !leftSet.has(member))
    .map((member) => [member, DiffFlag.Added] as const)

  return new Map<string, DiffFlag.Removed | DiffFlag.Added>([
    ...removeEntries,
    ...addEntries,
  ])
}
