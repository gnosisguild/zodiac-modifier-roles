import { revokePermissions, Call } from "./calls"
import { diffPermissions } from "./diffPermissions"
import { Target } from "./types"

/**
 * Computes the set of calls to update the current permissions (allowed targets) of a role to no longer include the permissions passed for `subtract`.
 * @param current permissions of the role that shall be updated
 * @param subtract permissions to subtract from the current permissions the role
 * @returns The set of calls to make to the Roles modifier owning the role
 */
export const removePermissions = (
  current: Target[],
  subtract: Target[]
): Call[] => {
  const notGranted = diffPermissions(subtract, current)
  const toRevoke = diffPermissions(subtract, notGranted)
  return revokePermissions(toRevoke)
}
