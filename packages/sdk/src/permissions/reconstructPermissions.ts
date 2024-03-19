import { Clearance, ExecutionOptions, Operator, Target } from "../types"

import {
  FunctionPermissionCoerced,
  PermissionCoerced,
  TargetPermission,
} from "./types"

/**
 * The inverse of `processPermissions`: Given a list of allowed targets, reconstruct the list of permissions that would produce it.
 * @param targets Targets that are allowed
 * @returns A set of permissions that produces these targets when processed
 */
export const reconstructPermissions = (
  targets: readonly Target[]
): PermissionCoerced[] => {
  return targets.flatMap((target) => {
    if (target.clearance === Clearance.None) {
      return []
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
        .map(splitFunctionPermission)
    }

    throw new Error(`Unknown clearance ${target.clearance}`)
  })
}

/** The inverse of mergeFunctionPermissions */
const splitFunctionPermission = (permission: FunctionPermissionCoerced) => {
  // only split permissions with top-level OR conditions
  if (
    permission.condition &&
    permission.condition.operator === Operator.Or &&
    permission.condition.children &&
    permission.condition.children.length > 0
  ) {
    permission.condition.children.map((child) => ({
      ...permission,
      condition: child,
    }))
  }

  return permission
}

const allowsSend = (execOptions: ExecutionOptions) =>
  execOptions === ExecutionOptions.Send || execOptions === ExecutionOptions.Both

const allowsDelegateCall = (execOptions: ExecutionOptions) =>
  execOptions === ExecutionOptions.DelegateCall ||
  execOptions === ExecutionOptions.Both
