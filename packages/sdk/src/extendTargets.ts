import { grant, Call } from "./calls"
import { diffTargets } from "./diffTargets"
import { Target } from "./types"

/**
 * Computes the set of calls to update the current targets of a role to include the additional targets.
 * @param current targets of the role that shall be updated
 * @param add targets to add to the role
 * @returns The set of calls to make to the Roles modifier owning the role
 */
export const extendTargets = (current: Target[], add: Target[]): Call[] => {
  // TODO if current grants a fully-cleared target, we need to remove function-scoped permissions to that target from add
  // TODO merge permissions to same target+function by joining their conditions with OR
  return grant(diffTargets(add, current))
}
