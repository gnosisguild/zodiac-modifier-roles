import diffPermissions from "./diffPermissions"
import grantPermissions from "./grantPermissions"
import removeObsoleteCalls from "./removeObsoleteCalls"
import revokePermissions from "./revokePermissions"
import { Call, Clearance, RolePermissions } from "./types"

const patchPermissions = (
  currentPermissions: RolePermissions,
  nextPermissions: RolePermissions
): Call[] => {
  const functionScopedTargets = currentPermissions.targets
    .filter((target) => target.clearance === Clearance.Function)
    .map((target) => target.address)

  return removeObsoleteCalls(
    [
      ...revokePermissions(
        diffPermissions(currentPermissions, nextPermissions)
      ),
      ...grantPermissions(diffPermissions(nextPermissions, currentPermissions)),
    ],
    functionScopedTargets
  )
}

export default patchPermissions
