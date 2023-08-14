import { Clearance, Target } from "../types"

import { Call } from "./types"

/**
 * Returns the most fine-grained calls to revoke the passed targets:
 *  - call revokeFunction for each function
 *  - call revokeTarget for each target without any functions
 */
export const revoke = (targets: Target[]): Call[] => {
  const calls: Call[] = []

  targets.forEach((target) => {
    if (
      target.clearance === Clearance.Target ||
      (target.clearance === Clearance.Function && target.functions.length === 0)
    ) {
      calls.push({
        call: "revokeTarget",
        targetAddress: target.address,
      })
      return
    }

    if (target.clearance === Clearance.Function) {
      target.functions.forEach((func) => {
        calls.push({
          call: "revokeFunction",
          targetAddress: target.address,
          selector: func.selector,
        })
      })
    }
  })

  return calls
}
