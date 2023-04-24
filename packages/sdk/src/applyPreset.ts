import { encodeCalls, logCall } from "./calls"
import { checkPermissionsIntegrity } from "./checkPermissionsIntegrity"
import { fetchRole } from "./fetchRole"
import { patchPermissions } from "./patchPermissions"
import { ChainId, Target } from "./types"

/**
 * Returns a set of populated transactions objects for updating the permissions of the given role.
 *
 * @param address The address of the roles modifier
 * @param roleKey The key of the role to update
 * @param permissions Permissions to apply to the role
 * @param [options.network] The chain where the roles modifier is deployed
 * @param [options.currentPermissions] The permissions that are currently set on the role. If not specified, they will be fetched from the subgraph.
 *
 */
export const applyPermissions = async (
  address: string,
  roleKey: string,
  permissions: Target[],
  options:
    | {
        network: ChainId
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
        address,
        roleKey,
        network: options.network,
      })
      currentPermissions = role.targets
    } else {
      throw new Error(
        "Either `currentPermissions` or `network` must be specified"
      )
    }
  }

  checkPermissionsIntegrity(permissions)
  const calls = patchPermissions(currentPermissions, permissions)
  calls.forEach((call) => logCall(call, console.debug))
  return encodeCalls(roleKey, calls)
}
