import { Operator, ParameterType } from "../types"

import {
  PresetAllowEntry,
  PermissionPreset,
  PresetFunction,
  PresetCondition,
} from "./types"
import { functionId, isScoped } from "./utils"

/**
 * Processes the allow entries of a preset and merges entries addressing the same function into a single entry.
 * This is done by merging the conditions using a logical OR.
 * @param preset The preset to process
 * @returns The updated preset
 */
export const mergeFunctionEntries = (
  preset: PermissionPreset
): PermissionPreset => ({
  ...preset,
  allow: preset.allow.reduce((result, entry) => {
    if (!isScoped(entry)) {
      result.push(entry)
      return result
    }

    const matchingEntry = result
      .filter(isScoped)
      .find((existingEntry) => functionId(existingEntry) === functionId(entry))
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

    // merge conditions into the entry we already have
    matchingEntry.condition = mergeConditions(matchingEntry, entry)
    return result
  }, [] as PresetAllowEntry[]),
})

/**
 * @dev Merges two conditions using a logical OR, flattening nested OR conditions. If the conditions are equal, it will still create separate OR branches.
 * These will be pruned later in sanitizeCondition().
 */
const mergeConditions = (
  a: PresetFunction,
  b: PresetFunction
): PresetCondition | undefined => {
  if (!!a.condition !== !!b.condition) {
    console.warn(
      `Target ${functionId(
        a
      )} is allowed with and without conditions. It will be allowed without conditions.`
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
