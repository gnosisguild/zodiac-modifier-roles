import { Call, encodeCalls, logCall } from "./calls"
import { checkIntegrity } from "./checkIntegrity"
import { extendTargets } from "./extendTargets"
import { fetchRole } from "./fetchRole"
import { removeTargets } from "./removeTargets"
import { replaceTargets } from "./replaceTargets"
import { ChainId, Target } from "./types"

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
        options.log === true
          ? console.log
          : (options.log as (message: string) => void)
      )
    )
  }

  return encodeCalls(roleKey, calls)
}
