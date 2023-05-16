import { grantPermissions, Call } from "./calls"
import { diffPermissions } from "./diffPermissions"
import { Target } from "./types"

/**
 * Computes the set of calls to update the current permissions (allowed targets) of a role to include the additional permissions.
 * @param current permissions of the role that shall be updated
 * @param add permissions to add to the current permissions the role
 * @returns The set of calls to make to the Roles modifier owning the role
 */
export const extendPermissions = (current: Target[], add: Target[]): Call[] => {
  return grantPermissions(diffPermissions(add, current))
}