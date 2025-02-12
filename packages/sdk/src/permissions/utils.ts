import { keccak256, ParamType, toUtf8Bytes } from "ethers"
import { ExecutionOptions as ExecutionOptionsEnum } from "zodiac-roles-deployments"

import { conditionAddress, normalizeCondition } from "../conditions"

import { StatedPermission, Permission, ExecutionFlags } from "./types"

export const execOptions = (options: ExecutionFlags): ExecutionOptionsEnum => {
  if (options.send && options.delegatecall) return ExecutionOptionsEnum.Both
  if (options.delegatecall) return ExecutionOptionsEnum.DelegateCall
  if (options.send) return ExecutionOptionsEnum.Send
  return ExecutionOptionsEnum.None
}

const sighash = (signature: string): string =>
  keccak256(toUtf8Bytes(signature)).substring(0, 10)

export const coercePermission = (permission: StatedPermission): Permission => {
  if ("selector" in permission || "signature" in permission) {
    return {
      targetAddress: permission.targetAddress.toLowerCase() as `0x${string}`,
      selector:
        "selector" in permission
          ? (permission.selector.toLowerCase() as `0x${string}`)
          : (sighash(permission.signature) as `0x${string}`),
      condition:
        typeof permission.condition === "function"
          ? permission.condition(ParamType.from("bytes"))
          : permission.condition,
      send: permission.send,
      delegatecall: permission.delegatecall,
    }
  } else {
    return {
      ...permission,
      targetAddress: permission.targetAddress.toLowerCase() as `0x${string}`,
    } as Permission
  }
}

export const isPermissionAllowed = (permission: Permission): boolean => {
  return !("selector" in permission)
}

export const isPermissionWildcarded = (permission: Permission): boolean => {
  return "selector" in permission && !permission.condition
}

export const isPermissionConditional = (permission: Permission): boolean => {
  return "selector" in permission && !!permission.condition
}

export const isPermissionScoped = (permission: Permission): boolean => {
  return (
    isPermissionWildcarded(permission) || isPermissionConditional(permission)
  )
}

export const targetId = (permission: Permission) =>
  "selector" in permission
    ? `${permission.targetAddress.toLowerCase()}.${permission.selector}`
    : `${permission.targetAddress.toLowerCase()}.*` // * will be always be sorted before any selector 0x...

export const permissionId = (permission: Permission) => {
  const cid =
    "condition" in permission && permission.condition
      ? conditionAddress(normalizeCondition(permission.condition))
      : ""
  return `${targetId(permission)}:${execOptions(permission)}:${cid}`
}
