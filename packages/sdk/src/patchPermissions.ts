import diffPermissions from "./diffPermissions"
import grantPermissions from "./grantPermissions"
import removeObsoleteCalls from "./removeObsoleteCalls"
import revokePermissions from "./revokePermissions"
import { Call, RolePermissions } from "./types"

const patchPermissions = (
  currentPermissions: RolePermissions,
  nextPermissions: RolePermissions
): Call[] => {
  return removeObsoleteCalls([
    ...revokePermissions(diffPermissions(currentPermissions, nextPermissions)),
    ...grantPermissions(diffPermissions(nextPermissions, currentPermissions)),
  ])
}

export default patchPermissions
