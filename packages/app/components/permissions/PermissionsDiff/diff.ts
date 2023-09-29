import { PermissionCoerced, targetId, permissionId } from "zodiac-roles-sdk"
import { DiffFlag, Preset } from "../types"
import { comparePermissionIds } from "../groupPermissions"

export const diffPermissions = (
  left: readonly PermissionCoerced[],
  right: readonly PermissionCoerced[]
) => {
  // upfront sorting is required for deterministic Modified / Modified pairings in step 4)
  const leftSorted = [...left].sort(comparePermissionIds)
  const rightSorted = [...right].sort(comparePermissionIds)

  const diffLeft = new Map<PermissionCoerced, DiffFlag>()
  const diffRight = new Map<PermissionCoerced, DiffFlag>()

  const leftIds = leftSorted.map((p) => ({
    target: targetId(p),
    permission: permissionId(p),
  }))
  const rightIds = rightSorted.map((p) => ({
    target: targetId(p),
    permission: permissionId(p),
  }))

  // 1) same permission ID in both lists: Identical / Identical
  leftSorted.forEach((permission, i) => {
    const ids = leftIds[i]
    const j = rightIds.findIndex((r) => r.permission === ids.permission)
    if (j >= 0) {
      diffLeft.set(permission, DiffFlag.Identical)
      diffRight.set(rightSorted[j], DiffFlag.Identical)
    }
  })

  // 2) new target ID in right: Hidden / Added
  rightSorted.forEach((permission, i) => {
    const ids = rightIds[i]
    const j = leftIds.findIndex((l) => l.target === ids.target)
    if (j === -1) {
      diffLeft.set(permission, DiffFlag.Hidden)
      diffRight.set(permission, DiffFlag.Added)
    }
  })

  // 3) missing target ID in right: Removed / Hidden
  leftSorted.forEach((permission, i) => {
    const ids = leftIds[i]
    const j = rightIds.findIndex((r) => r.target === ids.target)
    if (j === -1) {
      diffLeft.set(permission, DiffFlag.Removed)
      diffRight.set(permission, DiffFlag.Hidden)
    }
  })

  // 4) same target ID in both, different permission ID:
  //    - Modified / Modified until depleted
  //    - Removed / Hidden for remaining left
  leftSorted.forEach((permissionLeft, i) => {
    if (diffLeft.has(permissionLeft)) return

    const ids = leftIds[i]
    const match = rightSorted.find(
      (permissionRight, j) =>
        !diffRight.has(permissionRight) &&
        rightIds[j].target === ids.target &&
        rightIds[j].permission !== ids.permission
    )

    if (match) {
      diffLeft.set(permissionLeft, DiffFlag.Modified)
      diffRight.set(match, DiffFlag.Modified)
    } else {
      diffLeft.set(permissionLeft, DiffFlag.Removed)
      diffRight.set(permissionLeft, DiffFlag.Hidden)
    }
  })

  // *5) same target ID in both, different permission ID:
  //    - Hidden / Added for remaining right
  rightSorted.forEach((permissionRight, i) => {
    if (diffRight.has(permissionRight)) return

    const ids = rightIds[i]
    const match = leftSorted.find(
      (permissionLeft, j) =>
        !diffLeft.has(permissionLeft) &&
        leftIds[j].target === ids.target &&
        leftIds[j].permission !== ids.permission
    )

    if (match) {
      throw new Error(
        `invariant violation: match should have been added to diff already in the step before (match: ${JSON.stringify(
          match
        )})`
      )
    } else {
      diffLeft.set(permissionRight, DiffFlag.Hidden)
      diffRight.set(permissionRight, DiffFlag.Added)
    }
  })

  return [diffLeft, diffRight] as const
}

/** Given the diffPermissions result as input, returns all modified pairs in a map */
export const pairModified = (
  left: Map<PermissionCoerced, DiffFlag>,
  right: Map<PermissionCoerced, DiffFlag>
) => {
  const modifiedLeft = [...left.entries()].filter(
    ([_, flag]) => flag === DiffFlag.Modified
  )
  const modifiedRight = [...right.entries()].filter(
    ([_, flag]) => flag === DiffFlag.Modified
  )

  // Due to the deterministic order of items in the maps that diffPermissions guarantees, we can build pairs by index
  const entries = modifiedLeft.map(
    ([permission, _], i) => [permission, modifiedRight[i][0]] as const
  )
  // We include each pair twice, once for each direction, so the pair lookup can be done in both directions
  const entriesFlipped = entries.map(([left, right]) => [right, left] as const)

  return new Map<PermissionCoerced, PermissionCoerced>([
    ...entries,
    ...entriesFlipped,
  ])
}

export const diffPresets = (
  left: readonly Preset[],
  right: readonly Preset[]
) => {
  const diffLeft = new Map<PermissionCoerced, DiffFlag>()
  const diffRight = new Map<PermissionCoerced, DiffFlag>()
}

/** Return the diff status summarizing the statuses of a group of items */
export const groupDiff = (itemFlags: DiffFlag[]) => {
  if (itemFlags.every((flag) => flag === DiffFlag.Identical)) {
    return DiffFlag.Identical
  }
  if (itemFlags.every((flag) => flag === DiffFlag.Added)) {
    return DiffFlag.Added
  }
  if (itemFlags.every((flag) => flag === DiffFlag.Removed)) {
    return DiffFlag.Removed
  }
  if (itemFlags.every((flag) => flag === DiffFlag.Hidden)) {
    return DiffFlag.Hidden
  }

  return DiffFlag.Modified
}
