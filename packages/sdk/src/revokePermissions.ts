import { Call, Clearance, RolePermissions } from "./types"

// It will always only apply the most fine-grained revoke:
//  - call unscopeParameter for each function param
//  - call scopeRevokeFunction for each function without any params
//  - call revokeTarget for each target without any functions
// (comparisons/comparison values are not taking into account when revoking, it will still just unscopeParameter)
const revokePermissions = (permissions: RolePermissions): Call[] => {
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
        if (func.wildcarded || func.parameters.length === 0) {
          calls.push({
            call: "scopeRevokeFunction",
            targetAddress: target.address,
            functionSig: func.sighash,
          })
          return
        }

        func.parameters.forEach((param) => {
          calls.push({
            call: "unscopeParameter",
            targetAddress: target.address,
            functionSig: func.sighash,
            paramIndex: param.index,
          })
        })
      })
    }
  })

  return calls
}

export default revokePermissions
