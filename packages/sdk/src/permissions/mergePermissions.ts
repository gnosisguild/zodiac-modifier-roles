import { mergeConditions } from "./mergeConditions"
import { coercePermission, targetId } from "./utils"

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
export const mergePermissions = (permissions: Permission[]) =>
  permissions.reduce((result, entry) => {
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
