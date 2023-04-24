import { Roles__factory } from "../../evm/typechain-types"

import { fetchRole } from "./fetchRole"
import { ChainId } from "./types"

const rolesInterface = Roles__factory.createInterface()

/**
 * Returns a set of encoded call data to be sent to the Roles mod for updating the members of the given role.
 *
 * @param roleKey The key of the role
 * @param members Array of addresses that shall be assigned the role
 * @param [options.currentMembers] The members that are currently assigned this role. If not specified, they will be fetched from the subgraph.
 * @param [options.network] The chain where the Roles mod is deployed
 * @param [options.address] The address of the Roles mod
 */
export const applyMembers = async (
  roleKey: string,
  members: string[],
  options:
    | {
        network: ChainId
        address: string
      }
    | {
        currentMembers: string[]
      }
) => {
  let currentMembers = "currentMembers" in options && options.currentMembers

  if (!currentMembers) {
    if ("network" in options && options.network) {
      const role = await fetchRole({
        network: options.network,
        address: options.address,
        roleKey,
      })
      currentMembers = role.members
    } else {
      throw new Error(
        "Either `currentMembers` or `network` and `address` must be specified"
      )
    }
  }

  const toRemove = currentMembers.filter((member) => !members.includes(member))
  const toAdd = members.filter(
    (member) => !(currentMembers as string[]).includes(member) // weird that the cast is necessary here
  )

  return [
    ...toRemove.map((member) =>
      rolesInterface.encodeFunctionData("assignRoles", [
        member,
        [roleKey],
        [false],
      ])
    ),
    ...toAdd.map((member) =>
      rolesInterface.encodeFunctionData("assignRoles", [
        member,
        [roleKey],
        [true],
      ])
    ),
  ]
}
