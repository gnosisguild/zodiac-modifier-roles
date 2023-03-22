import {
  grantPermissions,
  revokePermissions,
  removeObsoleteCalls,
  Call,
} from "./calls"
import diffPermissions from "./diffPermissions"
import { Target } from "./types"

/**
 * Computes the set of calls to update the permissions of a role
 * @param current permissions (allowed targets) of the role that shall be updated
 * @param next permissions (allowed targets) of the role describing the desired target state
 * @returns The set of calls to make to the Roles modifier owning the role
 */
const patchPermissions = (current: Target[], next: Target[]): Call[] => {
  return removeObsoleteCalls([
    ...revokePermissions(diffPermissions(current, next)),
    ...grantPermissions(diffPermissions(next, current)),
  ])
}

export default patchPermissions
