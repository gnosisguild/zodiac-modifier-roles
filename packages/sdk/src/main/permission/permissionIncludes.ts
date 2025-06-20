import { Condition } from "zodiac-roles-deployments"
import { normalizeCondition, conditionId } from "../target/condition"

import { PermissionCoerced, FunctionPermissionCoerced } from "./types"
import {
  isPermissionAllowed,
  isPermissionConditional,
  isPermissionScoped,
  isPermissionWildcarded,
} from "./id"

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
  if (p1.targetAddress.toLowerCase() !== p2.targetAddress.toLowerCase()) {
    return false
  }

  if (p2.send && !p1.send) {
    return false
  }

  if (p2.delegatecall && !p1.delegatecall) {
    return false
  }

  if (isPermissionAllowed(p1)) {
    return true
  }

  if (isPermissionAllowed(p2)) {
    return false
  }

  // assert
  if (!isPermissionScoped(p1) || !isPermissionScoped(p2)) {
    throw new Error("Expected Both Scoped")
  }

  // Check selectors match for scoped permissions
  if (
    (p1 as FunctionPermissionCoerced).selector !==
    (p2 as FunctionPermissionCoerced).selector
  ) {
    return false
  }

  if (isPermissionWildcarded(p1)) {
    return true
  }

  if (isPermissionWildcarded(p2)) {
    return false
  }

  // assert
  if (!isPermissionConditional(p1) || !isPermissionConditional(p2)) {
    throw new Error("Expected Both Conditional")
  }

  const c1 = (p1 as FunctionPermissionCoerced).condition as Condition
  const c2 = (p2 as FunctionPermissionCoerced).condition as Condition

  return (
    conditionId(normalizeCondition(c1)) === conditionId(normalizeCondition(c2))
  )
}
