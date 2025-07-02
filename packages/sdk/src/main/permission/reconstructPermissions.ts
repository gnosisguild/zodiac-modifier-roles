import { Clearance, ExecutionOptions, Target } from "zodiac-roles-deployments"

import { PermissionCoerced, TargetPermission } from "./types"

export const reconstructPermissions = (
  targets: readonly Target[]
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
      return target.functions.map((func) => ({
        targetAddress: target.address,
        selector: func.selector,
        send: allowsSend(func.executionOptions),
        delegatecall: allowsDelegateCall(func.executionOptions),
        condition: !func.wildcarded ? func.condition : undefined,
      }))
    }

    throw new Error(`Unknown clearance ${target.clearance}`)
  })
}

const allowsSend = (execOptions: ExecutionOptions) =>
  execOptions === ExecutionOptions.Send || execOptions === ExecutionOptions.Both

const allowsDelegateCall = (execOptions: ExecutionOptions) =>
  execOptions === ExecutionOptions.DelegateCall ||
  execOptions === ExecutionOptions.Both
