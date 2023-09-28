import { PermissionCoerced, targetId, permissionId } from "zodiac-roles-sdk"
import { DiffFlag, Preset } from "../types"

export const diffPermissions = (
  left: readonly PermissionCoerced[],
  right: readonly PermissionCoerced[]
) => {
  const diffLeft = new Map<PermissionCoerced, DiffFlag>()
  const diffRight = new Map<PermissionCoerced, DiffFlag>()

  const leftIds = left.map((p) => ({
    target: targetId(p),
    permission: permissionId(p),
  }))
  const rightIds = right.map((p) => ({
    target: targetId(p),
    permission: permissionId(p),
  }))

  // * same permission ID in both lists: Identical / Identical
  left.forEach((permission, i) => {
    const ids = leftIds[i]
    const j = rightIds.findIndex((r) => r.permission === ids.permission)
    if (j >= 0) {
      diffLeft.set(permission, DiffFlag.Identical)
      diffRight.set(right[j], DiffFlag.Identical)
    }
  })

  // * new target ID in right: Hidden / Added
  right.forEach((permission, i) => {
    const ids = rightIds[i]
    const j = leftIds.findIndex((l) => l.target === ids.target)
    if (j === -1) {
      diffLeft.set(permission, DiffFlag.Hidden)
      diffRight.set(permission, DiffFlag.Added)
    }
  })

  // * missing target ID in right: Removed / Hidden
  left.forEach((permission, i) => {
    const ids = leftIds[i]
    const j = rightIds.findIndex((r) => r.target === ids.target)
    if (j === -1) {
      diffLeft.set(permission, DiffFlag.Added)
      diffRight.set(permission, DiffFlag.Hidden)
    }
  })

  // * same target ID in both, different permission ID:
  //    - Modified / Modified until depleted
  //    - Removed / Hidden for remaining left
  left.forEach((permissionLeft, i) => {
    if (diffLeft.has(permissionLeft)) return

    const ids = leftIds[i]
    const match = right.find(
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

  // * same target ID in both, different permission ID:
  //    - Hidden / Added for remaining right
  right.forEach((permissionRight, i) => {
    if (diffRight.has(permissionRight)) return

    const ids = rightIds[i]
    const match = left.find(
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

export const diffPresets = (
  left: readonly Preset[],
  right: readonly Preset[]
) => {
  const diffLeft = new Map<PermissionCoerced, DiffFlag>()
  const diffRight = new Map<PermissionCoerced, DiffFlag>()
}
