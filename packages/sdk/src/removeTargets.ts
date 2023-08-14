import { revoke, Call } from "./calls"
import { diffTargets } from "./diffTargets"
import { Target } from "./types"

/**
 * Computes the set of calls to update the current targets of a role to no longer include the targets passed for `subtract`.
 * @param current targets of the role that shall be updated
 * @param subtract targets to subtract from the current targets of the role
 * @returns The set of calls to make to the Roles modifier owning the role
 */
export const removeTargets = (
  current: Target[],
  subtract: Target[]
): Call[] => {
  const notGranted = diffTargets(subtract, current)
  const toRevoke = diffTargets(subtract, notGranted)
  // TODO throw, if subtract contains a function to a target that is fully-cleared in current
  return revoke(toRevoke)
}
