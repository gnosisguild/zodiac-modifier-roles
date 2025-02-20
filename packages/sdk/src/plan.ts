import {
  Allowance,
  Annotation,
  ChainId,
  fetchRole,
  fetchRolesMod,
  Role,
  Target,
} from "zodiac-roles-deployments"

import diff, { diffRole } from "./diff"

import { Call, encodeCalls, logCall } from "./calls"

type Options = {
  chainId: ChainId
  address: `0x${string}`
  log?: boolean | ((message: string) => void)
}

type RoleFragment = {
  key: `0x${string}`
  members?: `0x${string}`[]
  targets?: Target[]
  annotations?: Annotation[]
}

/**
 * Plans and encodes transactions to update a rolesMod to a desired state.
 *
 * Compares the current state (either provided or fetched from subgraph) with the
 * desired state, calculates necessary operations (additions and removals), and
 * encodes them into transaction calls that can be executed on-chain.
 *
 * Note: contrarily to plan*Role functions, this function does not support partial
 * state input. The full intended state must be provided.
 *
 * @param next - The complete desired state to apply
 * @param next.roles - Array of roles to be set
 * @param next.allowances - Array of allowances to be set
 * @param options - Configuration options for the operation
 * @param options.chainId - Chain ID where the rolesMod is deployed
 * @param options.address - Contract address of the rolesMod
 * @param options.current - Optional current state of the rolesMod. If not provided, will be fetched from subgraph
 * @param options.current.roles - Current array of roles in the rolesMod
 * @param options.current.allowances - Current array of allowances in the rolesMod
 * @param options.log - Optional logging function to output planned changes
 *
 * @returns Promise resolving to encoded transaction calls ready to be executed
 *
 */
export async function planApply(
  next: { roles: Role[]; allowances: Allowance[] },
  {
    chainId,
    address,
    current,
    log,
  }: {
    current?: {
      roles: Role[]
      allowances: Allowance[]
    }
  } & Options
) {
  const { minus, plus } = diff({
    prev: current || (await fetchRolesMod({ chainId, address })),
    next,
  })

  const calls = [...minus, ...plus]
  logCalls(calls, log)

  return encodeCalls(calls, address)
}

/**
 * Plans and encodes transactions to update a single role to a desired state.
 *
 * Compares the current state of the role (either provided or fetched from the
 * subgraph) with the desired state, calculates the necessary operations
 * (additions and removals), and encodes them into transaction calls for
 * on-chain execution.
 *
 * The desired state may be a partial fragment of the role, containing only the
 * fields that require updating. This function merges the fragment with the
 * current state to produce a complete role configuration. Thus, fields not
 * present in the fragment will remain unchanged.
 *
 * @param next - The complete desired role configuration to apply
 * @param options - Configuration options for the operation
 * @param options.chainId - Chain ID where the rolesMod is deployed
 * @param options.address - Contract address of the rolesMod
 * @param options.current - Optional current role configuration
 *                          If not provided, will be fetched from subgraph
 * @param options.log - Optional logging function to output planned changes
 *
 * @returns Promise resolving to encoded transaction calls ready to be executed
 */

export async function planApplyRole(
  fragment: RoleFragment,
  { chainId, address, current, log }: { current?: Role } & Options
) {
  const prev: Role =
    current ||
    (await fetchRole({ chainId, address, roleKey: fragment.key })) ||
    emptyRole(fragment.key)

  const next: Role = {
    ...prev,
    ...fragment,
  }

  const { minus, plus } = await diffRole({ prev, next })

  const calls = [...minus, ...plus]
  logCalls(calls, log)

  return encodeCalls(calls, address)
}

/**
 * Plans and encodes transactions to extend/augment an existing Role.
 *
 * Unlike planApplyRole which synchronizes to an exact intended state, this
 * function only adds new capabilities.
 *
 * In other words, this function only plans for additive/expanding changes. It
 * never restricts or removes previously allowed capabilities from a Role. If
 * something was previously allowed, applying the output of this function will
 * never make it disallowed.
 *
 * Examples:
 * - If a target is fully `allowed`, passing in a fragment that scopes or wildcards
 *   a function in that target will result in a NOOP (empty output)
 * - If a function was previously scoped with ExecutionOptions.send, scoping that
 *   function with ExecutionOptions.none will result in a NOOP (empty output)
 * - etc
 *
 * @param fragment - The partial role configuration to add to the existing role
 * @param fragment.key - The unique role identifier (hex string)
 * @param fragment.members - Optional array of member addresses to add to the role
 * @param fragment.targets - Optional array of target contracts and functions to
 *                           grant permissions for
 * @param fragment.annotations - Optional array of annotations to attach to the role
 * @param options - Configuration options for the operation
 * @param options.chainId - Chain ID where the rolesMod is deployed
 * @param options.address - Contract address of the rolesMod
 * @param options.current - Optional current role configuration
 *                          If not provided, will be fetched from subgraph
 * @param options.log - Optional logging function to output planned changes
 *
 * @returns Promise resolving to encoded transaction calls for implementation
 */
export async function planExtendRole(
  fragment: RoleFragment,
  { chainId, address, current, log }: { current?: Role } & Options
) {
  const { plus } = await diffRole({
    prev:
      current || (await fetchRole({ chainId, address, roleKey: fragment.key })),
    next: fragment,
  })

  // extend -> just the plus
  const calls = plus
  logCalls(calls, log)

  return encodeCalls(calls, address)
}

function logCalls(calls: Call[], log?: boolean | ((message: string) => void)) {
  if (!log) {
    return
  }

  for (const call of calls) {
    logCall(call, log === true ? console.log : log || undefined)
  }
}

function emptyRole(key: `0x${string}`): Role {
  return {
    key: key,
    members: [],
    targets: [],
    annotations: [],
    lastUpdate: 0,
  }
}
