import { Clearance, Role } from "../types"

import { Call } from "./types"

// It will apply the most fine-grained revoke:
//  - call scopeRevokeFunction for each function
//  - call revokeTarget for each target without any functions
// Parameters are not taken into account.
export const revokePermissions = (permissions: Role): Call[] => {
  const calls: Call[] = []

  permissions.targets.forEach((target) => {
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
          call: "scopeRevokeFunction",
          targetAddress: target.address,
          functionSig: func.selector,
        })
      })
    }
  })

  return calls
}
