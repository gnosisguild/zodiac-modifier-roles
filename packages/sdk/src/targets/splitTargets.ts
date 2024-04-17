/**
 *  Splits targets `a` granted by `a` that are not granted by `b`
 */

import { splitCondition } from "../conditions"
import { Target } from "../types"

import { diffTargets } from "./diffTargets"

/**
 * Given two sets of targets, split targets in the first `combined` set into the `split` set and the remainder. Returns the remainder targets.
 * Targets appearing in `combined` and `split` will have their conditions split so that the combination of the `split` and `remainder` targets is equal to `combined`.
 * @returns All targets from `combined` that are not included in `split`.
 * @throws If it is impossible to split the condition of a target present in `combined` and `split`.
 */
export const splitTargets = (
  combined: readonly Target[],
  split: readonly Target[]
): Target[] => {
  const remainder = diffTargets(combined, split)

  // For the remaining targets, split conditions so that the remaining condition branches don't include any of those that are already in `split`
  return remainder
    .map((target) => {
      const targetInSplit = split.find((t) => t.address === target.address)
      if (!targetInSplit) return target

      return {
        ...target,
        functions: target.functions.map((func) => {
          const funcInSplit = targetInSplit.functions.find(
            (f) => f.selector === func.selector
          )
          if (!funcInSplit) return func

          if (!funcInSplit.condition) {
            // The split includes the function without condition, so it should not be included in the remainder
            return null
          }
          if (!func.condition) {
            // The combined target set allows the function without condition, so we keep it like this in the remainder
            return func
          }

          const remainderCondition = splitCondition(
            func.condition,
            funcInSplit.condition
          )
          if (!remainderCondition) throw new Error("invariant violation")

          return {
            ...func,
            condition: remainderCondition,
          }
        }),
      }
    })
    .filter(Boolean) as Target[]
}
