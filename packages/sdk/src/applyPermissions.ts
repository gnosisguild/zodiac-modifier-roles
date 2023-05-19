import { Call, encodeCalls, logCall } from "./calls"
import { checkPermissionsIntegrity } from "./checkPermissionsIntegrity"
import { extendPermissions } from "./extendPermissions"
import { fetchRole } from "./fetchRole"
import { removePermissions } from "./removePermissions"
import { replacePermissions } from "./replacePermissions"
import { ChainId, Target } from "./types"

type Options = (
  | {
      /** Chain ID of the network the roles mod is deployed on */
      network: ChainId
      /** Address of the roles mod */
      address: string
    }
  | {
      /** The permissions that are currently set on the role */
      currentPermissions: Target[]
    }
) & {
  /**  The mode to use for updating the permissions of the role:
   *  - "replace": The role will have only the passed permissions, meaning that all other currently configured permissions will be revoked from the role
   *  - "extend": The role will keep its current permissions and will additionally be granted the passed permissions
   *  - "remove": All passed permissions will be revoked from the role
   */
  mode: "replace" | "extend" | "remove"
  log?: boolean | ((message: string) => void)
}

/**
 * Returns a set of encoded call data to be sent to the Roles mod for updating the permissions of the given role.
 *
 * @param roleKey The key of the role to update
 * @param permissions Permissions to apply to the role
 */
export const applyPermissions = async (
  roleKey: string,
  permissions: Target[],
  options: Options
) => {
  let currentPermissions =
    "currentPermissions" in options && options.currentPermissions

  if (!currentPermissions) {
    if ("network" in options && options.network) {
      const role = await fetchRole({
        network: options.network,
        address: options.address,
        roleKey,
      })
      currentPermissions = role.targets
    } else {
      throw new Error(
        "Either `currentPermissions` or `network` and `address` must be specified"
      )
    }
  }

  checkPermissionsIntegrity(permissions)

  let calls: Call[]
  switch (options.mode) {
    case "replace":
      calls = replacePermissions(currentPermissions, permissions)
      break
    case "extend":
      calls = extendPermissions(currentPermissions, permissions)
      break
    case "remove":
      calls = removePermissions(currentPermissions, permissions)
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
