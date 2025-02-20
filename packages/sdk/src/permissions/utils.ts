import { ethers, ParamType } from "ethers"
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

const sighash = (signature: string) => {
  const fragment = ethers.FunctionFragment.from(signature)
  const selector = ethers.id(fragment.format()).slice(0, 10)
  return selector
}

export const coercePermission = <P extends Permission>(
  permission: P
): P extends FunctionPermission
  ? FunctionPermissionCoerced
  : TargetPermission => {
  const selector = () => {
    if ("selector" in permission) {
      return { selector: permission.selector.toLowerCase() as `0x${string}` }
    }

    if ("signature" in permission) {
      return { selector: sighash(permission.signature) as `0x${string}` }
    }

    return {}
  }

  const condition = () => {
    if (
      "condition" in permission &&
      typeof permission.condition === "function"
    ) {
      return { condition: permission.condition(ParamType.from("bytes")) }
    }

    if ("condition" in permission) {
      return { condition: permission.condition }
    }

    return {}
  }

  const coerced: PermissionCoerced = {
    targetAddress: permission.targetAddress.toLowerCase() as `0x${string}`,
    ...selector(),
    ...condition(),
    send: Boolean(permission.send),
    delegatecall: Boolean(permission.delegatecall),
  }
  return coerced as any
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
