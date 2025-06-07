import { Operator, ParameterType } from "zodiac-roles-deployments"
import { normalizeCondition } from "../target/condition"

import { PermissionCoerced, FunctionPermissionCoerced } from "./types"

/**
 * Checks if one permission includes (supersedes or equals) another permission.
 *
 * A permission p1 includes p2 if:
 * 1. They target the same address with the same execution options (send/delegatecall)
 * 2. AND one of the following:
 *    - Both are wildcard permissions (no selector)
 *    - Both target the same function AND p1's condition includes p2's condition
 *
 * For conditions, p1 includes p2 when -> OR(p1.condition, p2.condition) equals p1.condition (p2 is a subset)
 *
 * @param p1 - The potentially broader permission
 * @param p2 - The permission to check if included in p1
 * @returns true if p1 includes p2, false otherwise
 *
 */
export function permissionIncludes(
  p1: PermissionCoerced,
  p2: PermissionCoerced
): boolean {
  if (
    p1.targetAddress !== p2.targetAddress ||
    Boolean(p1.send) !== Boolean(p2.send) ||
    Boolean(p1.delegatecall) !== Boolean(p2.delegatecall)
  ) {
    return false
  }

  // Check if both or neither have selector/condition
  const p1HasSelector = "selector" in p1
  const p2HasSelector = "selector" in p2
  const p1HasCondition = "condition" in p1 && Boolean(p1.condition)
  const p2HasCondition = "condition" in p2 && Boolean(p2.condition)

  if (p1HasSelector !== p2HasSelector || p1HasCondition !== p2HasCondition) {
    return false
  }

  if (!p1HasSelector) {
    return true
  }

  const fp1 = p1 as FunctionPermissionCoerced
  const fp2 = p2 as FunctionPermissionCoerced

  if (fp1.selector !== fp2.selector) {
    return false
  }

  if (!fp1.condition) {
    return true
  }

  /*
   * We rely on the normalization mechanism do detect whether a permission
   * is included (is subset of another)
   */
  return (
    normalizeCondition(fp1.condition!).$$id ===
    normalizeCondition({
      paramType: ParameterType.None,
      operator: Operator.Or,
      children: [fp1.condition!, fp2.condition!],
    }).$$id
  )
}
