import { PermissionCoerced, targetId, permissionId } from "zodiac-roles-sdk"
import { DiffFlag, PermissionsDiff, Preset } from "../types"
import { comparePermissionIds } from "../groupPermissions"

export const diffPermissions = (
  left: readonly PermissionCoerced[],
  right: readonly PermissionCoerced[]
) => {
  // upfront sorting is required for deterministic Modified / Modified pairings in step 4)
  const leftSorted = [...left].sort(comparePermissionIds)
  const rightSorted = [...right].sort(comparePermissionIds)

  const diffLeft = new Map<
    PermissionCoerced,
    { flag: DiffFlag; modified?: PermissionCoerced }
  >()
  const diffRight = new Map<
    PermissionCoerced,
    { flag: DiffFlag; modified?: PermissionCoerced }
  >()

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
      diffLeft.set(permission, { flag: DiffFlag.Identical })
      diffRight.set(rightSorted[j], { flag: DiffFlag.Identical })
    }
  })

  // 2) new target ID in right: Hidden / Added
  rightSorted.forEach((permission, i) => {
    const ids = rightIds[i]
    const j = leftIds.findIndex((l) => l.target === ids.target)
    if (j === -1) {
      diffLeft.set(permission, { flag: DiffFlag.Hidden })
      diffRight.set(permission, { flag: DiffFlag.Added })
    }
  })

  // 3) missing target ID in right: Removed / Hidden
  leftSorted.forEach((permission, i) => {
    const ids = leftIds[i]
    const j = rightIds.findIndex((r) => r.target === ids.target)
    if (j === -1) {
      diffLeft.set(permission, { flag: DiffFlag.Removed })
      diffRight.set(permission, { flag: DiffFlag.Hidden })
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
      diffLeft.set(permissionLeft, { flag: DiffFlag.Modified, modified: match })
      diffRight.set(match, {
        flag: DiffFlag.Modified,
        modified: permissionLeft,
      })
    } else {
      diffLeft.set(permissionLeft, { flag: DiffFlag.Removed })
      diffRight.set(permissionLeft, { flag: DiffFlag.Hidden })
    }
  })

  // 5) same target ID in both, different permission ID:
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
      diffLeft.set(permissionRight, { flag: DiffFlag.Hidden })
      diffRight.set(permissionRight, { flag: DiffFlag.Added })
    }
  })

  return [diffLeft, diffRight] as const
}

export const diffPresets = (
  left: readonly Preset[],
  right: readonly Preset[]
) => {
  // upfront sorting is required for deterministic Modified / Modified pairings in steps 1+2
  const leftSorted = [...left].sort(comparePresetUris)
  const rightSorted = [...right].sort(comparePresetUris)

  const diffLeft = new Map<
    Preset,
    { flag: DiffFlag; modified?: Preset; permissions?: PermissionsDiff }
  >()
  const diffRight = new Map<
    Preset,
    { flag: DiffFlag; modified?: Preset; permissions?: PermissionsDiff }
  >()

  // 1) same uri in both lists: Identical / Identical or Modified / Modified if permissions changed
  leftSorted.forEach((l) => {
    const r = rightSorted.find((r) => r.uri === l.uri)
    if (r) {
      const [permissionsLeft, permissionsRight] = diffPermissions(
        l.permissions,
        r.permissions
      )
      const somePermissionsChanged =
        groupDiff([...permissionsLeft.values()].map((v) => v.flag)) !==
        DiffFlag.Identical

      if (somePermissionsChanged) {
        diffLeft.set(l, {
          flag: DiffFlag.Modified,
          modified: r,
          permissions: permissionsLeft,
        })
        diffRight.set(r, {
          flag: DiffFlag.Modified,
          modified: l,
          permissions: permissionsRight,
        })
      } else {
        diffLeft.set(l, { flag: DiffFlag.Identical })
        diffRight.set(r, { flag: DiffFlag.Identical })
      }
    }
  })

  // 2) new path key in right: Hidden / Added
  rightSorted.forEach((r) => {
    if (!leftSorted.some((l) => l.pathKey === r.pathKey)) {
      diffLeft.set(r, { flag: DiffFlag.Hidden })
      diffRight.set(r, { flag: DiffFlag.Added })
    }
  })

  // 3) missing path key in right: Removed / Hidden
  leftSorted.forEach((l) => {
    if (!rightSorted.some((r) => r.pathKey === l.pathKey)) {
      diffLeft.set(l, { flag: DiffFlag.Removed })
      diffRight.set(l, { flag: DiffFlag.Hidden })
    }
  })

  // 4) same path key in both, different uri
  //    - Modified / Modified until depleted
  //    - Removed / Hidden for remaining left
  leftSorted.forEach((l) => {
    if (diffLeft.has(l)) return

    const r = rightSorted.find(
      (r) => !diffRight.has(r) && r.pathKey === l.pathKey && r.uri !== l.uri
    )

    if (r) {
      const [permissionsLeft, permissionsRight] = diffPermissions(
        l.permissions,
        r.permissions
      )

      diffLeft.set(l, {
        flag: DiffFlag.Modified,
        modified: r,
        permissions: permissionsLeft,
      })
      diffRight.set(r, {
        flag: DiffFlag.Modified,
        modified: l,
        permissions: permissionsRight,
      })
    } else {
      diffLeft.set(l, { flag: DiffFlag.Removed })
      diffRight.set(l, { flag: DiffFlag.Hidden })
    }
  })

  // 5) same path key in both, different uri:
  //    - Hidden / Added for remaining right
  rightSorted.forEach((r) => {
    if (diffRight.has(r)) return

    const l = leftSorted.find(
      (l) => !diffLeft.has(l) && l.pathKey === r.pathKey && l.uri !== r.uri
    )

    if (l) {
      throw new Error(
        `invariant violation: match should have been added to diff already in the step before (match: ${JSON.stringify(
          l
        )})`
      )
    } else {
      diffLeft.set(r, { flag: DiffFlag.Hidden })
      diffRight.set(r, { flag: DiffFlag.Added })
    }
  })

  return [diffLeft, diffRight] as const
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

const comparePresetUris = (a: Preset, b: Preset) => (a.uri > b.uri ? 1 : -1)
