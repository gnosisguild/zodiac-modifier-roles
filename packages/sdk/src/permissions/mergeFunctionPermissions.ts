import { Condition, Operator, ParameterType } from "../types"

import {
  PermissionCoerced,
  FunctionPermissionCoerced,
  Permission,
} from "./types"
import { coercePermission, targetId, isFunctionScoped } from "./utils"

/**
 * Processes the permissions and merges entries addressing the same target (targetAddress+selector) into a single entry.
 * This is done by merging the conditions using a logical OR.
 * @param permissions The permissions to process
 * @returns The updated permissions
 */
export const mergeFunctionPermissions = (permissions: Permission[]) =>
  permissions.reduce((result, entry) => {
    if (!isFunctionScoped(entry)) {
      result.push({
        ...entry,
        targetAddress: entry.targetAddress.toLowerCase() as `0x${string}`,
      })
      return result
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

    // merge conditions into the entry we already have
    matchingEntry.condition = mergeConditions(matchingEntry, coercedEntry)
    return result
  }, [] as PermissionCoerced[])

/**
 * @dev Merges two conditions using a logical OR, flattening nested OR conditions. If the conditions are equal, it will still create separate OR branches.
 * These will be pruned later in sanitizeCondition().
 */
const mergeConditions = (
  a: FunctionPermissionCoerced,
  b: FunctionPermissionCoerced
): Condition | undefined => {
  if (!!a.condition !== !!b.condition) {
    const id = targetId(a)
    console.warn(
      `Target ${id} is allowed with and without conditions. It will be allowed without conditions.`
    )
    return undefined
  }

  if (!a.condition || !b.condition) return undefined

  const aBranches =
    a.condition.operator === Operator.Or ? a.condition.children : [a.condition]
  const bBranches =
    b.condition.operator === Operator.Or ? b.condition.children : [b.condition]

  return {
    paramType: ParameterType.None,
    operator: Operator.Or,
    children: [...(aBranches || []), ...(bBranches || [])],
  }
}
