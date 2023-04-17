import { Clearance, Function, Target } from "../types"

import { Call } from "./types"

export const grantPermissions = (targets: Target[]): Call[] => {
  const calls: Call[] = []

  targets.forEach((target) => {
    if (target.clearance === Clearance.Target) {
      calls.push({
        call: "allowTarget",
        targetAddress: target.address,
        executionOptions: target.executionOptions,
      })
    }

    if (target.clearance === Clearance.Function) {
      // function scoping requires setting the target to function clearance
      calls.push({
        call: "scopeTarget",
        targetAddress: target.address,
      })

      target.functions.forEach((func) => {
        if (func.wildcarded) {
          calls.push({
            call: "allowFunction",
            targetAddress: target.address,
            selector: func.selector,
            executionOptions: func.executionOptions,
          })
        } else {
          calls.push(scopeFunction(func, target.address))
        }
      })
    }
  })

  return calls
}

const scopeFunction = (func: Function, targetAddress: string): Call => {
  if (!func.condition) {
    throw new Error("Non-wildcarded function must have a condition")
  }

  return {
    call: "scopeFunction",
    targetAddress,
    selector: func.selector,
    condition: func.condition,
    executionOptions: func.executionOptions,
  }
}
