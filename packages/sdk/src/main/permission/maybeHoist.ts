import { Condition, Operator } from "zodiac-roles-deployments"

import {
  hoistTopOrs,
  hoistCondition,
  normalizeCondition,
} from "../target/condition"
import { permissionIncludes } from "./permissionIncludes"

import { FunctionPermissionCoerced, PermissionCoerced } from "./types"

/**
 * Hoists a permission condition by testing different hoisting strategies to maximize probe hits.
 *
 * Hoisting pulls logical operators (AND/OR) up from within MATCHES nodes to try to revert some of
 * the pushDownNode performed by normalizeConditionDeprecated. We need this to determine which annotations
 * are applied
 *
 * Tests three strategies:
 * - **Naive**: No hoisting, only normalizeConditionNext
 * - **Full hoisting**: Complete generic hoisting using `hoistCondition`
 * - **Top-level OR hoisting**: Selective hoisting using `hoistTopOrs`
 *
 * Each strategy is scored by counting probe hits. The highest scoring strategy wins.
 * In case of ties, the original condition is returned (without hoisting)
 *
 */
export function maybeHoist(
  permission: FunctionPermissionCoerced,
  probes?: PermissionCoerced[]
): Condition | undefined {
  if (!permission.condition) {
    return permission.condition
  }

  const normalized = normalizeCondition(permission.condition)

  if (!probes || probes.length == 0) {
    return normalized
  }

  const { result } = [
    normalized,
    hoistCondition(normalized),
    ...hoistTopOrs(normalized),
  ]
    .map(
      (condition) =>
        [countHits({ ...permission, condition }, probes), condition] as [
          number,
          Condition,
        ]
    )
    .reduce(
      ({ max, result }, [count, condition]) => {
        return count > max
          ? { max: count, result: condition }
          : { max: count, result }
      },
      { max: -1, result: {} as Condition }
    )

  return result
}

function countHits(
  dest: FunctionPermissionCoerced,
  src: PermissionCoerced[]
): number {
  const split =
    dest.condition?.operator == Operator.Or
      ? dest.condition.children!.map((child) => ({ ...dest, condition: child }))
      : [dest]

  return split.reduce(
    (count, a) => count + src.filter((b) => permissionIncludes(a, b)).length,
    0
  )
}
