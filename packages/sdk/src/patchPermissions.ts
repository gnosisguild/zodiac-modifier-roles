import {
  grantPermissions,
  revokePermissions,
  removeObsoleteCalls,
  Call,
} from "./calls"
import { diffPermissions } from "./diffPermissions"
import { Target } from "./types"

/**
 * Computes the set of calls to update the permissions (allowed targets) of a role
 * @param current permissions of the role that shall be updated
 * @param next permissions of the role describing the desired target state
 * @returns The set of calls to make to the Roles modifier owning the role
 */
export const patchPermissions = (current: Target[], next: Target[]): Call[] => {
  return removeObsoleteCalls([
    ...revokePermissions(diffPermissions(current, next)),
    ...grantPermissions(diffPermissions(next, current)),
  ])
}
