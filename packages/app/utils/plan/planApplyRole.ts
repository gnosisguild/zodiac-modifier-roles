import { ChainId, Role, fetchLicense } from "zodiac-roles-sdk"

import { fetchRole, fetchRolesModConfig } from "@/utils/subgraph"

import { Call } from "./Call"
import { encodeCalls } from "./encodeCalls"
import { enforceLicenseTerms } from "./enforceLicenseTerms"
import { logCall } from "./logCall"
import { diffRole } from "./diff/role"

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
 */
export async function planApplyRole(
  desired: Partial<Role> & { key: `0x${string}` },
  { chainId, address, current, log }: { current?: Role } & Options
): Promise<Result> {
  const prev =
    current || (await fetchRole({ chainId, address, roleKey: desired.key }))
  const next = {
    ...(prev || { members: [], targets: [], annotations: [], lastUpdate: 0 }),
    ...clean(desired),
  }

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

  const { minus, plus } = diffRole({ prev, next })

  const calls = [...minus, ...plus]
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

function clean<T extends object>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== null && v !== undefined)
  ) as T
}
