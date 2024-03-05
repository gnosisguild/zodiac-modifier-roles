import { Roles__factory } from "../../evm/typechain-types"

import { fetchRole } from "./fetchRole"
import { ChainId } from "./types"

const rolesInterface = Roles__factory.createInterface()

type Options = (
  | {
      /** ID of the Chain where the Roles mod is deployed */
      chainId: ChainId
      /** Address of the roles mod */
      address: string
    }
  | {
      /** The addresses of all current members of this role. If not specified, they will be fetched from the subgraph. */
      currentMembers: string[]
    }
) & {
  /**  The mode to use for updating the set of members of the role:
   *  - "replace": The role will have only the passed members, meaning that all other current members will be removed from the role
   *  - "extend": The role will keep its current members and will additionally get the passed members
   *  - "remove": All passed members will be removed from the role
   */
  mode: "replace" | "extend" | "remove"
}

/**
 * Returns a set of encoded call data to be sent to the Roles mod for updating the members of the given role.
 *
 * @param roleKey The key of the role
 * @param members Array of member addresses
 */
export const applyMembers = async (
  roleKey: string,
  members: string[],
  options: Options
) => {
  let currentMembers = "currentMembers" in options && options.currentMembers

  if (!currentMembers) {
    if ("chainId" in options && options.chainId) {
      const role = await fetchRole({
        chainId: options.chainId,
        address: options.address,
        roleKey,
      })
      if (!role) {
        throw new Error(`Role ${roleKey} not found on chain ${options.chainId}`)
      }
      currentMembers = role.members
    } else {
      throw new Error(
        "Either `currentMembers` or `chainId` and `address` must be specified"
      )
    }
  }

  switch (options.mode) {
    case "replace":
      return replaceMembers(roleKey, currentMembers, members)
    case "extend":
      return extendMembers(roleKey, currentMembers, members)
    case "remove":
      return removeMembers(roleKey, currentMembers, members)
    default:
      throw new Error(`Invalid mode: ${options.mode}`)
  }
}

const replaceMembers = (roleKey: string, current: string[], next: string[]) => {
  const toRemove = current.filter((member) => !next.includes(member))
  const toAdd = next.filter((member) => !current.includes(member))

  return [
    ...toRemove.map((member) => removeMember(roleKey, member)),
    ...toAdd.map((member) => addMember(roleKey, member)),
  ]
}

export const extendMembers = (
  roleKey: string,
  current: string[],
  add: string[]
) => {
  const toAdd = add.filter((member) => !current.includes(member))
  return toAdd.map((member) => addMember(roleKey, member))
}

const removeMembers = (
  roleKey: string,
  current: string[],
  remove: string[]
) => {
  const toRemove = remove.filter((member) => current.includes(member))
  return toRemove.map((member) => removeMember(roleKey, member))
}

const addMember = (roleKey: string, member: string) => {
  return rolesInterface.encodeFunctionData("assignRoles", [
    member,
    [roleKey],
    [true],
  ]) as `0x${string}`
}

const removeMember = (roleKey: string, member: string) => {
  return rolesInterface.encodeFunctionData("assignRoles", [
    member,
    [roleKey],
    [false],
  ]) as `0x${string}`
}
