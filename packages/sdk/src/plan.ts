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

export async function planApply(
  apply: { roles: Role[]; allowances: Allowance[] },
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
    next: apply,
  })

  const calls = [...minus, ...plus]
  logCalls(calls, log)

  return encodeCalls(calls, address)
}

export async function planApplyRole(
  role: Role,
  { chainId, address, current, log }: { current?: Role } & Options
) {
  const { minus, plus } = await diffRole({
    prev: current || (await fetchRole({ chainId, address, roleKey: role.key })),
    next: role,
  })

  const calls = [...minus, ...plus]
  logCalls(calls, log)

  return encodeCalls(calls, address)
}

type RoleFragment = {
  key: `0x${string}`
  members?: `0x${string}`[]
  targets?: Target[]
  annotations?: Annotation[]
}

export async function planExtendRole(
  role: RoleFragment,
  { chainId, address, current, log }: { current?: Role } & Options
) {
  const { plus } = await diffRole({
    prev: current || (await fetchRole({ chainId, address, roleKey: role.key })),
    next: role,
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
