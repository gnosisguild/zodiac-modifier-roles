import { Condition, Operator } from "zodiac-roles-deployments"

import {
  hoistTopOrs,
  hoistCondition,
  normalizeConditionNext,
} from "../target/condition"
import { permissionIncludes } from "./permissionIncludes"

import { FunctionPermissionCoerced, PermissionCoerced } from "./types"

/*
 *
 * 1. Takes a permission with a condition and optional probes
 * 2. Computes naive, hoisted, and hoistedTopOrs variantes
 * 3. Counts how many probes each variant produces
 * 4. Returns the maybe hoisted condition that produces most matches against probes (on tie, original wins)
 * 5. When no probes are provides, the condition is normalized and nothing else
 *
 */
export function maybeHoist(
  permission: FunctionPermissionCoerced,
  probes?: PermissionCoerced[]
): Condition | undefined {
  if (!permission.condition) {
    return permission.condition
  }

  const naive = {
    ...permission,
    condition: normalizeConditionNext(permission.condition),
  }

  if (!probes) {
    return naive.condition
  }

  const countNaive = _count(naive, probes)

  const entries = [
    hoistCondition(naive.condition),
    ...hoistTopOrs(naive.condition),
  ]
    .map((condition) => ({ ...permission, condition }))
    .map(
      (permissionHoisted) =>
        [_count(permissionHoisted, probes), permissionHoisted.condition] as [
          number,
          Condition,
        ]
    )

  let countHoisted = -1
  let hoisted = null
  for (const [count, _condition] of entries) {
    if (count > countHoisted) {
      countHoisted = count
      hoisted = _condition
    }
  }

  // in case of a tie, keep the original
  return countHoisted > countNaive ? hoisted! : permission.condition!
}

function _count(dest: FunctionPermissionCoerced, src: PermissionCoerced[]) {
  const split =
    dest.condition?.operator == Operator.Or
      ? dest.condition.children!.map((child) => ({ ...dest, condition: child }))
      : [dest]

  return split.reduce(
    (count, a) => count + src.filter((b) => permissionIncludes(a, b)).length,
    0
  )
}
