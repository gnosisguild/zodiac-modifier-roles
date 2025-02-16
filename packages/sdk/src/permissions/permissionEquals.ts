import { normalizeCondition } from "../conditions"

import { PermissionCoerced, FunctionPermissionCoerced } from "./types"

export function permissionEquals(
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

  if (!p1HasSelector || !p2HasSelector) {
    return true
  }

  const fp1 = p1 as FunctionPermissionCoerced
  const fp2 = p2 as FunctionPermissionCoerced

  if (fp1.selector !== fp2.selector) {
    return false
  }

  if (!fp1.condition && !fp2.condition) {
    return true
  }

  return (
    normalizeCondition(fp1.condition!).$$id ===
    normalizeCondition(fp2.condition!).$$id
  )
}
