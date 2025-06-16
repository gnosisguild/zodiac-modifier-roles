import {
  conditionAddress,
  normalizeConditionNext as normalizeCondition,
} from "../target/condition"
import { executionFlagsToOptions } from "./executionFlagsToOptions"

import {
  PermissionCoerced,
  FunctionPermissionCoerced,
  TargetPermission,
} from "./types"

export const targetId = (permission: PermissionCoerced) =>
  "selector" in permission
    ? `${permission.targetAddress.toLowerCase()}.${permission.selector}`
    : `${permission.targetAddress.toLowerCase()}.*` // * will be always be sorted before any selector 0x...

export const permissionId = (permission: PermissionCoerced) => {
  const cid =
    "condition" in permission && permission.condition
      ? conditionAddress(normalizeCondition(permission.condition))
      : ""
  return `${targetId(permission)}:${executionFlagsToOptions(permission)}:${cid}`
}

export const isPermissionAllowed = (
  permission: PermissionCoerced
): permission is TargetPermission => {
  return !("selector" in permission) && !("signature" in permission)
}

export const isPermissionScoped = (
  permission: PermissionCoerced
): permission is FunctionPermissionCoerced => {
  return "selector" in permission || "signature" in permission
}

export const isPermissionWildcarded = (
  permission: PermissionCoerced
): permission is FunctionPermissionCoerced => {
  return isPermissionScoped(permission) && !permission.condition
}

export const isPermissionConditional = (
  permission: PermissionCoerced
): permission is FunctionPermissionCoerced => {
  return isPermissionScoped(permission) && !!permission.condition
}
