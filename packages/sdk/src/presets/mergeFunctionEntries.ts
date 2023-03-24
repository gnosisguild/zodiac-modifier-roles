import { Operator, ParameterType } from "../types"

import { PresetAllowEntry, PresetCondition, PermissionPreset } from "./types"
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
    matchingEntry.condition = mergeConditions(
      matchingEntry.condition,
      entry.condition
    )
    return result
  }, [] as PresetAllowEntry[]),
})

const mergeConditions = (
  a: PresetCondition | undefined,
  b: PresetCondition | undefined
) => {
  if (!a || !b) return undefined

  const aBranches = a.operator === Operator.Or ? a.children : [a]
  const bBranches = b.operator === Operator.Or ? b.children : [b]

  return {
    paramType: ParameterType.None,
    operator: Operator.Or,
    conditions: [...(aBranches || []), ...(bBranches || [])],
  }
}
