import {
  Allowance,
  Annotation,
  ChainId,
  fetchRole,
  fetchRolesMod,
  Role,
  Target,
} from "zodiac-roles-deployments"
import diffRolesMod from "../diff/diffRolesMod"
import diffRole from "../diff/diffRole"

import { Call, encodeCalls, logCall } from "../calls"

type Options = (
  | { chainId: ChainId; address: `0x${string}` }
  | { currentRoles?: Role[]; currentAllowances?: Allowance[] }
) & {
  log?: boolean | ((message: string) => void)
}

type RoleOptions = (
  | { chainId: ChainId; address: `0x${string}` }
  | { currentRole?: Role }
) & {
  log?: boolean | ((message: string) => void)
}

export async function planApply(
  rolesMod: { roles: Role[]; allowances: Allowance[] },
  options: Options
) {
  const prev = await maybeFetchRolesMod(options)
  const { minus, plus } = await diffRolesMod({ prev, next: rolesMod })

  const calls = [...minus, ...plus]
  logCalls(calls, options)

  return encodeCalls(calls)
}

export async function planApplyRole(role: Role, options: RoleOptions) {
  const roleKey = role.key
  const prev = await maybeFetchRole(role.key, options)
  const { minus, plus } = await diffRole({ roleKey, prev, next: role })

  const calls = [...minus, ...plus]
  logCalls(calls, options)

  return encodeCalls(calls)
}

export async function planExtendRole(
  role: {
    key: `0x${string}`
    members?: `0x${string}`[]
    targets?: Target[]
    annotations?: Annotation[]
  },
  options: RoleOptions
) {
  const prev = await maybeFetchRole(role.key, options)
  const { plus } = await diffRole({
    roleKey: role.key,
    prev,
    next: { members: [], targets: [], annotations: [], ...role },
  })

  // extend only, just the plus
  const calls = plus
  logCalls(calls, options)

  return encodeCalls(calls)
}

function logCalls(
  calls: Call[],
  { log }: { log?: boolean | ((message: string) => void) }
) {
  if (!log) {
    return
  }

  for (const call of calls) {
    logCall(call, log === true ? console.log : log || undefined)
  }
}

async function maybeFetchRolesMod(
  options: Options
): Promise<{ roles: Role[]; allowances: Allowance[] } | undefined> {
  if ("address" in options) {
    return (
      (await fetchRolesMod({
        chainId: options.chainId,
        address: options.address,
      })) || undefined
    )
  } else {
    return options.currentRoles || options.currentAllowances
      ? {
          roles: options.currentRoles || [],
          allowances: options.currentAllowances || [],
        }
      : undefined
  }
}

async function maybeFetchRole(
  roleKey: `0x${string}`,
  options: RoleOptions
): Promise<Role | undefined> {
  if ("address" in options) {
    return (
      (await fetchRole({
        chainId: options.chainId,
        address: options.address,
        roleKey,
      })) || undefined
    )
  } else {
    return options.currentRole || undefined
  }
}
