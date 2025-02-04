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

export async function planApply(
  next: { roles: Role[]; allowances: Allowance[] },
  options: Options
) {
  const prev = await maybeFetchRolesMod(options)

  const { minus, plus } = diff({ prev, next })

  const calls = [...minus, ...plus]
  logCalls(calls, options)

  return encodeCalls(calls)
}

export async function planApplyRole(next: Role, options: RoleOptions) {
  const prev = await maybeFetchRole(next.key, options)

  const { minus, plus } = await diffRole({ roleKey: next.key, prev, next })

  const calls = [...minus, ...plus]
  logCalls(calls, options)

  return encodeCalls(calls)
}

type RoleFragment = {
  key: `0x${string}`
  members?: `0x${string}`[]
  targets?: Target[]
  annotations?: Annotation[]
}

export async function planExtendRole(next: RoleFragment, options: RoleOptions) {
  const prev = await maybeFetchRole(next.key, options)

  const { plus } = await diffRole({ roleKey: next.key, prev, next })

  // extend -> just the plus
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

type Options = (
  | { chainId: ChainId; address: `0x${string}` }
  | { currentRoles?: Role[]; currentAllowances?: Allowance[] }
) & {
  log?: boolean | ((message: string) => void)
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

type RoleOptions = (
  | { chainId: ChainId; address: `0x${string}` }
  | { currentRole?: Role }
) & {
  log?: boolean | ((message: string) => void)
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
