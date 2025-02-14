import { mergeConditions } from "./mergeConditions"
import { isPermissionAllowed, isPermissionScoped, targetId } from "./utils"

import { PermissionCoerced, FunctionPermissionCoerced } from "./types"

/**
 * Processes the permissions and merges entries addressing the same target (targetAddress+selector) into a single entry.
 * This is done by merging the conditions using a logical OR.
 * @param permissions The permissions to process
 * @returns The updated permissions
 */
export function mergePermissions(permissions: readonly PermissionCoerced[]) {
  const mergedPermissions = permissions.reduce((result, entry) => {
    const matchingEntry = result.find(
      (existingEntry) => targetId(existingEntry) === targetId(entry)
    ) as FunctionPermissionCoerced | undefined

    if (!matchingEntry) {
      result.push(entry)
      return result
    }

    if (
      !!matchingEntry.send !== !!entry.send ||
      !!matchingEntry.delegatecall !== !!entry.delegatecall
    ) {
      // we don't merge if execution options are different
      result.push(entry)
      return result
    }

    if ("selector" in entry) {
      // merge conditions into the entry we already have
      matchingEntry.condition = mergeConditions(matchingEntry, entry)
    }

    return result
  }, [] as PermissionCoerced[])

  /*
   * allowed     -> Clearance.Target
   * wildcarded  -> Clearance.Function AND wildcarded == true AND condition == undefined
   * conditional -> Clearance.Function AND wildcarded == false AND condition == defined
   * scoped      -> wilcarded or conditional
   */
  assertNoAllowedScopedIntersection(mergedPermissions)
  assertNoDuplicateAllowedTarget(mergedPermissions)
  assertNoDuplicateScopedFunction(mergedPermissions)

  return mergedPermissions
}

const assertNoAllowedScopedIntersection = (
  permissions: PermissionCoerced[]
) => {
  const allowedTargets = permissions
    .filter(isPermissionAllowed)
    .map((entry) => entry.targetAddress)

  const scopedTargets = permissions
    .filter(isPermissionScoped)
    .map((entry) => entry.targetAddress)

  const intersection = allowedTargets.filter((x) => scopedTargets.includes(x))

  if (intersection.length > 0) {
    throw new Error(
      `An address can either be fully allowed or scoped to selected functions. The following addresses are both: ${intersection.join(
        ", "
      )}`
    )
  }
}

const assertNoDuplicateAllowedTarget = (permissions: PermissionCoerced[]) => {
  const targetIds = permissions
    .filter((p) => !isPermissionScoped(p))
    .map(targetId)

  const counts = targetIds.reduce(
    (result, targetId) => ({
      ...result,
      [targetId]: (result[targetId] || 0) + 1,
    }),
    {} as Record<string, number>
  )
  const duplicates = targetIds.filter((targetId) => counts[targetId] > 1)

  if (duplicates.length > 0) {
    throw new Error(
      `The following targets appear multiple times and cannot be merged: ${duplicates.join(
        ", "
      )}.\nThis might be be due to different \`send\` and \`delegatecall\` flags in entries with the same target.`
    )
  }
}

const assertNoDuplicateScopedFunction = (permissions: PermissionCoerced[]) => {
  const functionIds = permissions.filter(isPermissionScoped).map(targetId)

  const counts = functionIds.reduce(
    (result, functionId) => ({
      ...result,
      [functionId]: (result[functionId] || 0) + 1,
    }),
    {} as Record<string, number>
  )
  const duplicates = functionIds.filter((functionId) => counts[functionId] > 1)

  if (duplicates.length > 0) {
    throw new Error(
      `The following functions appear multiple times and cannot be merged: ${duplicates.join(
        ", "
      )}.\nThis might be be due to different \`send\` and \`delegatecall\` flags in entries with the same target.`
    )
  }
}
