import {
  grantPermissions,
  revokePermissions,
  removeObsoleteCalls,
  Call,
} from "./calls"
import diffPermissions from "./diffPermissions"
import { Role } from "./types"

const patchPermissions = (
  currentPermissions: Role,
  nextPermissions: Role
): Call[] => {
  return removeObsoleteCalls([
    ...revokePermissions(diffPermissions(currentPermissions, nextPermissions)),
    ...grantPermissions(diffPermissions(nextPermissions, currentPermissions)),
  ])
}

export default patchPermissions
