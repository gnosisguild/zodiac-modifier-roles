import { mergeConditions } from "./mergeConditions"
import { coercePermission, isPermissionScoped, targetId } from "./utils"

import {
  PermissionCoerced,
  FunctionPermissionCoerced,
  Permission,
} from "./types"

/**
 * Processes the permissions and merges entries addressing the same target (targetAddress+selector) into a single entry.
 * This is done by merging the conditions using a logical OR.
 * @param permissions The permissions to process
 * @returns The updated permissions
 */
export function mergePermissions(permissions: Permission[]) {
  const mergedPermissions = permissions.reduce((result, entry) => {
    entry = {
      ...entry,
      targetAddress: entry.targetAddress.toLowerCase() as `0x${string}`,
    }
    const coercedEntry = coercePermission(entry)

    const matchingEntry = result.find(
      (existingEntry) => targetId(existingEntry) === targetId(coercedEntry)
    ) as FunctionPermissionCoerced | undefined

    if (!matchingEntry) {
      result.push(coercedEntry)
      return result
    }

    if (
      !!matchingEntry.send !== !!entry.send ||
      !!matchingEntry.delegatecall !== !!entry.delegatecall
    ) {
      // we don't merge if execution options are different
      result.push(coercedEntry)
      return result
    }

    if ("selector" in coercedEntry) {
      // merge conditions into the entry we already have
      matchingEntry.condition = mergeConditions(matchingEntry, coercedEntry)
    }

    return result
  }, [] as PermissionCoerced[])

  assertNoWildcardScopedIntersection(mergedPermissions)
  assertNoDuplicateAllowFunction(mergedPermissions)
  assertNoDuplicateAllowTarget(mergedPermissions)

  return mergedPermissions
}

const assertNoWildcardScopedIntersection = (
  permissions: PermissionCoerced[]
) => {
  const wildcardTargets = permissions
    .filter((entry) => !isPermissionScoped(entry))
    .map((entry) => entry.targetAddress)

  const scopedTargets = new Set(
    permissions.filter(isPermissionScoped).map((entry) => entry.targetAddress)
  )

  const intersection = [
    ...new Set(wildcardTargets.filter((x) => scopedTargets.has(x))),
  ]
  if (intersection.length > 0) {
    throw new Error(
      `An address can either be fully allowed or scoped to selected functions. The following addresses are both: ${intersection.join(
        ", "
      )}`
    )
  }
}

const assertNoDuplicateAllowFunction = (permissions: PermissionCoerced[]) => {
  const allowFunctions = permissions.filter(isPermissionScoped).map(targetId)

  const counts = allowFunctions.reduce(
    (result, item) => ({ ...result, [item]: (result[item] || 0) + 1 }),
    {} as Record<string, number>
  )
  const duplicates = [
    ...new Set(allowFunctions.filter((item) => counts[item] > 1)),
  ]

  if (duplicates.length > 0) {
    throw new Error(
      `The following functions appear multiple times and cannot be merged: ${duplicates.join(
        ", "
      )}.\nThis might be be due to different \`send\` and \`delegatecall\` flags in entries with the same target.`
    )
  }
}

const assertNoDuplicateAllowTarget = (permissions: PermissionCoerced[]) => {
  const allowTarget = permissions
    .filter((p) => !isPermissionScoped(p))
    .map(targetId)

  const counts = allowTarget.reduce(
    (result, item) => ({ ...result, [item]: (result[item] || 0) + 1 }),
    {} as Record<string, number>
  )
  const duplicates = [
    ...new Set(allowTarget.filter((item) => counts[item] > 1)),
  ]

  if (duplicates.length > 0) {
    throw new Error(
      `The following targets appear multiple times and cannot be merged: ${duplicates.join(
        ", "
      )}.\nThis might be be due to different \`send\` and \`delegatecall\` flags in entries with the same target.`
    )
  }
}
