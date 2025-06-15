import assert from "assert"
import { Condition, Operator } from "zodiac-roles-deployments"
import {
  normalizeConditionNext as normalizeCondition,
  conditionId,
} from "../target/condition"
import { hoistCondition } from "../target/condition/hoistCondition"

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

  if (isPermissionAllowed(p1) !== isPermissionAllowed(p2)) {
    return false
  }

  if (isPermissionScoped(p1) !== isPermissionScoped(p2)) {
    return false
  }

  if (isPermissionWildcarded(p1) !== isPermissionWildcarded(p2)) {
    return false
  }

  if (isPermissionConditional(p1) !== isPermissionConditional(p2)) {
    console.log(p1)
    console.log(p2)
    return false
  }

  if (isPermissionScoped(p1) && p1.selector !== (p2 as any).selector) {
    return false
  }

  const c1 = (p1 as FunctionPermissionCoerced).condition
  const c2 = (p2 as FunctionPermissionCoerced).condition

  if (!c1 || !c2) {
    return true
  }

  if (
    conditionId(normalizeCondition(c1)) === conditionId(normalizeCondition(c2))
  ) {
    return true
  }

  if (inOrCondition(c1, c2)) {
    return true
  }

  return inOrCondition(hoistCondition(c1), c2)
}

function inOrCondition(c1: Condition, c2: Condition): boolean {
  if (c1.operator !== Operator.Or || !Array.isArray(c1.children)) {
    return false
  }

  const id = conditionId(normalizeCondition(c2))

  return c1.children.some(
    (child) => conditionId(normalizeCondition(child)) === id
  )
}
