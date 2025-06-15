import {
  Clearance,
  Condition,
  ExecutionOptions,
  Operator,
  Target,
} from "zodiac-roles-deployments"

import { maybeHoist } from "./maybeHoist"

import {
  FunctionPermissionCoerced,
  PermissionCoerced,
  TargetPermission,
} from "./types"

export const reconstructPermissions = (
  targets: readonly Target[],
  probes?: PermissionCoerced[]
): PermissionCoerced[] => {
  return targets.flatMap((target) => {
    if (target.clearance === Clearance.None) {
      return [] as PermissionCoerced[]
    }

    if (target.clearance === Clearance.Target) {
      return {
        targetAddress: target.address,
        send: allowsSend(target.executionOptions),
        delegatecall: allowsDelegateCall(target.executionOptions),
      } as TargetPermission
    }

    if (target.clearance === Clearance.Function) {
      return target.functions
        .map((func) => ({
          targetAddress: target.address,
          selector: func.selector,
          send: allowsSend(func.executionOptions),
          delegatecall: allowsDelegateCall(func.executionOptions),
          condition: !func.wildcarded ? func.condition : undefined,
        }))
        .map((permission) => ({
          ...permission,
          condition: maybeHoist(permission, probes),
        }))
        .flatMap(splitFunctionPermission)
    }

    throw new Error(`Unknown clearance ${target.clearance}`)
  })
}

const splitFunctionPermission = (
  permission: FunctionPermissionCoerced
): FunctionPermissionCoerced[] => {
  // only split permissions with top-level OR conditions

  if (
    permission.condition &&
    permission.condition.operator === Operator.Or &&
    permission.condition.children &&
    permission.condition.children.length > 0
  ) {
    return permission.condition.children.map((child) => ({
      ...permission,
      condition: child,
    }))
  }

  return [permission]
}

const allowsSend = (execOptions: ExecutionOptions) =>
  execOptions === ExecutionOptions.Send || execOptions === ExecutionOptions.Both

const allowsDelegateCall = (execOptions: ExecutionOptions) =>
  execOptions === ExecutionOptions.DelegateCall ||
  execOptions === ExecutionOptions.Both
