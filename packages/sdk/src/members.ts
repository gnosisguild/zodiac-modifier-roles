import { getAddress } from "ethers"
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
  log?: boolean | ((message: string) => void)
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

  const currentSet = new Set(
    currentMembers.map((member) => getAddress(member) as `0x${string}`)
  )
  const membersSet = new Set(
    members.map((member) => getAddress(member) as `0x${string}`)
  )

  let assignments: { add: `0x${string}`[]; remove: `0x${string}`[] }
  switch (options.mode) {
    case "replace":
      assignments = replaceMembers(currentSet, membersSet)
      break
    case "extend":
      assignments = extendMembers(currentSet, membersSet)
      break
    case "remove":
      assignments = removeMembers(currentSet, membersSet)
      break
    default:
      throw new Error(`Invalid mode: ${options.mode}`)
  }

  if (options.log) {
    const log = options.log === true ? console.log : options.log
    assignments.remove.forEach((account) => log(`👤 Remove member ${account}`))
    assignments.add.forEach((account) => log(`👤 Add member ${account}`))
  }

  return [
    ...assignments.remove.map((member) => encodeRemoveCall(roleKey, member)),
    ...assignments.add.map((member) => encodeAddCall(roleKey, member)),
  ]
}

const replaceMembers = (
  current: Set<`0x${string}`>,
  next: Set<`0x${string}`>
) => ({
  remove: [...current].filter((member) => !next.has(member)),
  add: [...next].filter((member) => !current.has(member)),
})

const extendMembers = (
  current: Set<`0x${string}`>,
  add: Set<`0x${string}`>
) => ({
  remove: [],
  add: [...add].filter((member) => !current.has(member)),
})

const removeMembers = (
  current: Set<`0x${string}`>,
  remove: Set<`0x${string}`>
) => ({
  remove: [...remove].filter((member) => current.has(member)),
  add: [],
})

const encodeAddCall = (roleKey: `0x${string}`, member: `0x${string}`) => {
  return rolesInterface.encodeFunctionData("assignRoles", [
    member,
    [roleKey],
    [true],
  ]) as `0x${string}`
}

const encodeRemoveCall = (roleKey: `0x${string}`, member: `0x${string}`) => {
  return rolesInterface.encodeFunctionData("assignRoles", [
    member,
    [roleKey],
    [false],
  ]) as `0x${string}`
}
