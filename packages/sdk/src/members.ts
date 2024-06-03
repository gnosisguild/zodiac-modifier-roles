import { fetchRole, ChainId } from "zodiac-roles-deployments"

import { Roles__factory } from "../../evm/typechain-types"

const rolesInterface = Roles__factory.createInterface()

type Options = (
  | {
      /** ID of the Chain where the Roles mod is deployed */
      chainId: ChainId
      /** Address of the roles mod */
      address: `0x${string}`
    }
  | {
      /** The addresses of all current members of this role. If not specified, they will be fetched from the subgraph. */
      currentMembers: readonly `0x${string}`[]
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
  roleKey: `0x${string}`,
  members: readonly `0x${string}`[],
  options: Options
) => {
  let currentMembers: readonly `0x${string}`[]

  if ("currentMembers" in options && options.currentMembers) {
    currentMembers = options.currentMembers
  } else {
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

const replaceMembers = (
  roleKey: `0x${string}`,
  current: readonly `0x${string}`[],
  next: readonly `0x${string}`[]
) => {
  const toRemove = current.filter((member) => !next.includes(member))
  const toAdd = next.filter((member) => !current.includes(member))

  return [
    ...toRemove.map((member) => removeMember(roleKey, member)),
    ...toAdd.map((member) => addMember(roleKey, member)),
  ]
}

export const extendMembers = (
  roleKey: `0x${string}`,
  current: readonly `0x${string}`[],
  add: readonly `0x${string}`[]
) => {
  const toAdd = add.filter((member) => !current.includes(member))
  return toAdd.map((member) => addMember(roleKey, member))
}

const removeMembers = (
  roleKey: `0x${string}`,
  current: readonly `0x${string}`[],
  remove: readonly `0x${string}`[]
) => {
  const toRemove = remove.filter((member) => current.includes(member))
  return toRemove.map((member) => removeMember(roleKey, member))
}

const addMember = (roleKey: `0x${string}`, member: `0x${string}`) => {
  return rolesInterface.encodeFunctionData("assignRoles", [
    member,
    [roleKey],
    [true],
  ]) as `0x${string}`
}

const removeMember = (roleKey: `0x${string}`, member: `0x${string}`) => {
  return rolesInterface.encodeFunctionData("assignRoles", [
    member,
    [roleKey],
    [false],
  ]) as `0x${string}`
}
