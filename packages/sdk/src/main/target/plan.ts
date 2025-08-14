import {
  ChainId,
  fetchRole,
  fetchRolesMod,
  fetchRolesModConfig,
  Role,
  RolesModifier,
} from "zodiac-roles-deployments"

import { type Call, encodeCalls, logCall } from "./calls"
import { diff, diffRole } from "./diff"
import { enforceLicenseTerms, fetchLicense } from "../licensing"
import { spreadRolePartial, spreadRolesModifierPartial } from "./partials"

import { RolePartial, RolesModifierPartial } from "./types"

type Options = {
  chainId: ChainId
  address: `0x${string}`
  log?: boolean | ((message: string) => void)
}

type Result = {
  to: `0x${string}`
  data: `0x${string}`
}[]

/**
 * Plans and encodes transactions to update a `rolesMod` to a desired state.
 *
 * Compares the current state (either provided or fetched from the subgraph)
 * with the desired state, calculates the necessary operations (additions and
 * removals), and encodes them as transaction calls for on-chain execution.
 *
 * Note: Unlike `plan*Role` functions, this function does not support partial
 * state input. The full intended state must be provided.
 *
 * @param desired - The state to apply. It may be a partial representation, which gets merged with the current full representation.
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
  desired: RolesModifierPartial,
  {
    chainId,
    address,
    current,
    log,
  }: {
    current?: RolesModifier
  } & Options
): Promise<Result> {
  const prev = current || (await fetchRolesMod({ chainId, address }))
  const next = spreadRolesModifierPartial(prev, desired)

  const roleModConfig = await fetchRolesModConfig({ chainId, address })
  if (roleModConfig) {
    const license = await fetchLicense({ chainId, owner: roleModConfig.owner })
    for (const role of next.roles) {
      enforceLicenseTerms({
        role,
        license,
        chainId,
        owner: roleModConfig.owner,
      })
    }
  }

  const { minus, plus } = diff({
    prev: current || (await fetchRolesMod({ chainId, address })),
    next,
  })

  const calls = [...minus, ...plus]
  logCalls(calls, log)

  return encodeCalls(calls, address)
}

export function callsPlannedForApply(
  prev: RolesModifier,
  next: RolesModifier
): Call[] {
  const { minus, plus } = diff({ prev, next })
  return [...minus, ...plus]
}

/**
 * Plans and encodes transactions to update a single role to a desired state.
 *
 * Compares the current role state (either provided or fetched from the
 * subgraph) with the desired state, calculates the necessary operations
 * (additions and removals), and encodes them as transaction calls for
 * on-chain execution.
 *
 * The desired state may be a partial fragment of the role, containing only
 * the fields that need updates. This function merges the fragment with the
 * current state to create a complete role configuration. Fields not included
 * in the fragment remain unchanged.
 *
 * @param desired - The state to apply. It may be a partial representation, which gets merged with the current full representation.
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
  desired: RolePartial,
  { chainId, address, current, log }: { current?: Role } & Options
): Promise<Result> {
  const prev =
    current || (await fetchRole({ chainId, address, roleKey: desired.key }))
  const next = spreadRolePartial(prev, desired)

  const rolesModConfig = await fetchRolesModConfig({ chainId, address })
  if (rolesModConfig) {
    const license = await fetchLicense({
      chainId,
      owner: rolesModConfig.owner,
    })
    enforceLicenseTerms({
      role: next,
      license,
      chainId,
      owner: rolesModConfig.owner,
    })
  }

  const { minus, plus } = await diffRole({ prev, next })

  const calls = [...minus, ...plus]
  logCalls(calls, log)

  return encodeCalls(calls, address)
}

export function callsPlannedForApplyRole(prev: Role, next: Role): Call[] {
  const { minus, plus } = diffRole({ prev, next })
  return [...minus, ...plus]
}

/**
 * Plans and encodes transactions to extend/augment an existing Role.
 *
 * Unlike `planApplyRole`, which updates to an exact intended state, this
 * function only adds new capabilities without limiting/removing existing ones.
 *
 * In other words, this function is strictly additive. It never restricts or
 * removes previously granted capabilities. If a capability was allowed
 * before, applying the output of this function will not disallow it.
 *
 * Examples:
 * - If a target is fully `allowed`, passing a fragment that scopes or wildcards
 *   a function in that target will result in a NOOP (empty output).
 * - If a function was previously scoped with `ExecutionOptions.send`, scoping
 *   it with `ExecutionOptions.none` will result in a NOOP (empty output).
 * - Etc.
 *
 * @param desired - The state to apply. It may be a partial representation, which gets merged with the current full representation.
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
  desired: RolePartial,
  { chainId, address, current, log }: { current?: Role } & Options
): Promise<Result> {
  const prev =
    current || (await fetchRole({ chainId, address, roleKey: desired.key }))
  const next = spreadRolePartial(prev, desired)

  const roleModConfig = await fetchRolesModConfig({ chainId, address })
  if (roleModConfig) {
    const license = await fetchLicense({ chainId, owner: roleModConfig.owner })
    enforceLicenseTerms({
      role: next,
      license,
      chainId,
      owner: roleModConfig.owner,
    })
  }

  const { plus } = await diffRole({ prev, next })

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
