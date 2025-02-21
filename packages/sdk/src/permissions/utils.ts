import { keccak256, ParamType, toUtf8Bytes } from "ethers"
import { ExecutionOptions as ExecutionOptionsEnum } from "zodiac-roles-deployments"

import { conditionAddress, normalizeCondition } from "../conditions"

import {
  Permission,
  PermissionCoerced,
  FunctionPermission,
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

const sighash = (signature: string): string =>
  keccak256(toUtf8Bytes(signature)).substring(0, 10)

export const coercePermission = <P extends Permission>(
  permission: P
): P extends FunctionPermission
  ? FunctionPermissionCoerced
  : TargetPermission => {
  permission = {
    ...permission,
    targetAddress: permission.targetAddress.toLowerCase() as `0x${string}`,
    send: Boolean(permission.send),
    delegatecall: Boolean(permission.delegatecall),
  }

  if (isPermissionScoped(permission)) {
    return {
      targetAddress: permission.targetAddress,
      selector:
        "selector" in permission
          ? permission.selector.toLowerCase()
          : sighash(permission.signature),
      condition:
        typeof permission.condition === "function"
          ? permission.condition(ParamType.from("bytes"))
          : permission.condition,
      send: permission.send,
      delegatecall: permission.delegatecall,
    } as FunctionPermissionCoerced
  }
  return permission as any
}

export const isPermissionAllowed = (
  permission: Permission
): permission is TargetPermission => {
  return !("selector" in permission) && !("signature" in permission)
}

export const isPermissionScoped = (
  permission: Permission
): permission is FunctionPermission => {
  return "selector" in permission || "signature" in permission
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
