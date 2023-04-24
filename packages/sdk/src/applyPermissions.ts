import { encodeCalls, logCall } from "./calls"
import { checkPermissionsIntegrity } from "./checkPermissionsIntegrity"
import { fetchRole } from "./fetchRole"
import { patchPermissions } from "./patchPermissions"
import { ChainId, Target } from "./types"

/**
 * Returns a set of encoded call data to be sent to the Roles mod for updating the permissions of the given role.
 *
 * @param roleKey The key of the role to update
 * @param permissions Permissions to apply to the role
 * @param [options.currentPermissions] The permissions that are currently set on the role. If not specified, they will be fetched from the subgraph.
 * @param [options.network] The chain where the Roles mod is deployed
 * @param [options.address] The address of the Roles mod
 */
export const applyPermissions = async (
  roleKey: string,
  permissions: Target[],
  options:
    | {
        network: ChainId
        address: string
      }
    | {
        currentPermissions: Target[]
      }
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
  const calls = patchPermissions(currentPermissions, permissions)
  calls.forEach((call) => logCall(call, console.debug))
  return encodeCalls(roleKey, calls)
}
