import { ExecutionOptions as ExecutionOptionsEnum } from "zodiac-roles-deployments"

import { conditionAddress, normalizeCondition } from "../target/condition/"

import {
  PermissionCoerced,
  FunctionPermissionCoerced,
  ExecutionFlags,
  TargetPermission,
} from "./types"

export const execOptions = (options: ExecutionFlags): ExecutionOptionsEnum => {
  if (options.send && options.delegatecall) return ExecutionOptionsEnum.Both
  if (options.delegatecall) return ExecutionOptionsEnum.DelegateCall
  if (options.send) return ExecutionOptionsEnum.Send
  return ExecutionOptionsEnum.None
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

export const targetId = (permission: PermissionCoerced) =>
  "selector" in permission
    ? `${permission.targetAddress.toLowerCase()}.${permission.selector}`
    : `${permission.targetAddress.toLowerCase()}.*` // * will be always be sorted before any selector 0x...

export const permissionId = (permission: PermissionCoerced) => {
  const cid =
    "condition" in permission && permission.condition
      ? conditionAddress(normalizeCondition(permission.condition))
      : ""
  return `${targetId(permission)}:${execOptions(permission)}:${cid}`
}
