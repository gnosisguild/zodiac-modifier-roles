import {
  Call,
  encodeCalls,
  grant,
  logCall,
  removeObsoleteCalls,
  revoke,
} from "../calls"
import { fetchRole } from "../fetchRole"
import { ChainId, Target } from "../types"

import { checkIntegrity } from "./checkIntegrity"
import { diffTargets } from "./diffTargets"

type Options = (
  | {
      /** ID of the chain where the Roles mod is deployed */
      chainId: ChainId
      /** Address of the roles mod */
      address: string
    }
  | {
      /** The targets that are currently configured for the role */
      currentTargets: Target[]
    }
) & {
  /**  The mode to use for updating the targets of the role:
   *  - "replace": The role will have only the passed targets, meaning that all other currently configured targets will be revoked from the role
   *  - "extend": The role will keep its current targets and will additionally be granted the passed targets
   *  - "remove": All passed targets will be revoked from the role
   */
  mode: "replace" | "extend" | "remove"
  log?: boolean | ((message: string) => void)
}

/**
 * Returns a set of encoded call data to be sent to the Roles mod for updating the targets of the given role.
 *
 * @param roleKey The key of the role to update
 * @param targets Targets to apply to the role
 */
export const applyTargets = async (
  roleKey: string,
  targets: Target[],
  options: Options
) => {
  let currentTargets = "currentTargets" in options && options.currentTargets

  if (!currentTargets) {
    if ("chainId" in options && options.chainId) {
      const role = await fetchRole({
        chainId: options.chainId,
        address: options.address,
        roleKey,
      })
      if (!role) {
        throw new Error(`Role ${roleKey} not found on chain ${options.chainId}`)
      }
      currentTargets = role.targets
    } else {
      throw new Error(
        "Either `currentTargets` or `chainId` and `address` must be specified"
      )
    }
  }

  checkIntegrity(targets)

  let calls: Call[]
  switch (options.mode) {
    case "replace":
      calls = replaceTargets(currentTargets, targets)
      break
    case "extend":
      calls = extendTargets(currentTargets, targets)
      break
    case "remove":
      calls = removeTargets(currentTargets, targets)
      break
    default:
      throw new Error(`Invalid mode: ${options.mode}`)
  }

  if (options.log) {
    calls.forEach((call) =>
      logCall(
        call,
        options.log === true ? console.log : options.log || undefined
      )
    )
  }

  return encodeCalls(roleKey, calls)
}

const extendTargets = (current: Target[], add: Target[]): Call[] => {
  // TODO if current grants a fully-cleared target, we need to remove function-scoped permissions to that target from add
  // TODO merge permissions to same target+function by joining their conditions with OR
  return grant(diffTargets(add, current))
}

/**
 * Computes the set of calls to update the current targets of a role to no longer include the targets passed for `subtract`.
 * @param current targets of the role that shall be updated
 * @param subtract targets to subtract from the current targets of the role
 * @returns The set of calls to make to the Roles modifier owning the role
 */
const removeTargets = (current: Target[], subtract: Target[]): Call[] => {
  const notGranted = diffTargets(subtract, current)
  const toRevoke = diffTargets(subtract, notGranted)
  // TODO throw, if subtract contains a function to a target that is fully-cleared in current
  return revoke(toRevoke)
}

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
