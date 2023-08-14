import { grant, revoke, removeObsoleteCalls, Call } from "./calls"
import { diffTargets } from "./diffTargets"
import { Target } from "./types"

/**
 * Computes the set of calls to update the targets of a role
 * @param current targets of the role that shall be updated
 * @param next targets of the role describing the desired target state
 * @returns The set of calls to make to the Roles modifier owning the role
 */
export const replaceTargets = (current: Target[], next: Target[]): Call[] => {
  return removeObsoleteCalls([
    ...revoke(diffTargets(current, next)),
    ...grant(diffTargets(next, current)),
  ])
}
