import {
  RolesModifier,
  Role,
  Target,
  Allowance,
  Function,
  Clearance,
  ExecutionOptions,
} from "zodiac-roles-deployments"
import {
  TargetPartial,
  RolePartial,
  AllowancePartial,
  RolesModifierPartial,
} from "./types"

export function applyTargetPartial(
  target: Target,
  partial: TargetPartial
): Target {
  invariant(target.address === partial.address)

  let functions: Function[]

  if (Array.isArray(partial.functions)) {
    // Array replaces entirely
    functions = partial.functions
  } else if (partial.functions) {
    // Map: merge with existing, updating only specified selectors
    const functionsMap = new Map(target.functions.map((f) => [f.selector, f]))

    for (const [selector, func] of Object.entries(
      partial.functions as Record<string, Function>
    )) {
      functionsMap.set(selector as `0x${string}`, func)
    }

    functions = Array.from(functionsMap.values())
  } else {
    functions = target.functions
  }

  return {
    address: partial.address,
    clearance: partial.clearance ?? target.clearance,
    executionOptions: partial.executionOptions ?? target.executionOptions,
    functions,
  }
}

export function applyRolePartial(role: Role, partial: RolePartial): Role {
  invariant(role.key == partial.key)
  let targets: Target[]

  if (Array.isArray(partial.targets)) {
    // Array replaces entirely
    targets = partial.targets.map((targetPartial) => {
      const existingTarget = role.targets.find(
        (t) => t.address === targetPartial.address
      )
      return existingTarget
        ? applyTargetPartial(existingTarget, targetPartial)
        : applyTargetPartial(
            getDefaultTarget(targetPartial.address),
            targetPartial
          )
    })
  } else if (partial.targets) {
    // Map: merge with existing, updating only specified addresses
    const targetsMap = new Map(role.targets.map((t) => [t.address, t]))

    for (const [address, targetPartial] of Object.entries(partial.targets)) {
      const existingTarget = targetsMap.get(address as `0x${string}`)
      const updatedTarget = existingTarget
        ? applyTargetPartial(existingTarget, targetPartial)
        : applyTargetPartial(
            getDefaultTarget(address as `0x${string}`),
            targetPartial
          )
      targetsMap.set(address as `0x${string}`, updatedTarget)
    }

    targets = Array.from(targetsMap.values())
  } else {
    targets = role.targets
  }

  return {
    key: partial.key,
    members: partial.members ?? role.members,
    targets,
    annotations: partial.annotations ?? role.annotations,
    lastUpdate: partial.lastUpdate ?? role.lastUpdate,
  }
}

export function applyAllowancePartial(
  allowance: Allowance,
  partial: AllowancePartial
): Allowance {
  invariant(allowance.key === partial.key)
  return {
    key: partial.key,
    refill: partial.refill ?? allowance.refill,
    maxRefill: partial.maxRefill ?? allowance.maxRefill,
    period: partial.period ?? allowance.period,
    balance: partial.balance ?? allowance.balance,
    timestamp: partial.timestamp ?? allowance.timestamp,
  }
}

export function applyRolesModifierPartial(
  rolesModifier: RolesModifier,
  partial: RolesModifierPartial
): RolesModifier {
  let roles: Role[]
  let allowances: Allowance[]

  if (Array.isArray(partial.roles)) {
    // Array replaces entirely
    roles = partial.roles.map((rolePartial) => {
      const existingRole = rolesModifier.roles.find(
        (r) => r.key === rolePartial.key
      )
      return existingRole
        ? applyRolePartial(existingRole, rolePartial)
        : applyRolePartial(getDefaultRole(rolePartial.key), rolePartial)
    })
  } else if (partial.roles) {
    // Map: merge with existing, updating only specified keys
    const rolesMap = new Map(rolesModifier.roles.map((r) => [r.key, r]))

    for (const [key, rolePartial] of Object.entries(partial.roles)) {
      const existingRole = rolesMap.get(key as `0x${string}`)
      const updatedRole = existingRole
        ? applyRolePartial(existingRole, rolePartial)
        : applyRolePartial(getDefaultRole(key as `0x${string}`), rolePartial)
      rolesMap.set(key as `0x${string}`, updatedRole)
    }

    roles = Array.from(rolesMap.values())
  } else {
    roles = rolesModifier.roles
  }

  if (Array.isArray(partial.allowances)) {
    // Array replaces entirely
    allowances = partial.allowances.map((allowancePartial) => {
      const existingAllowance = rolesModifier.allowances.find(
        (a) => a.key === allowancePartial.key
      )
      return existingAllowance
        ? applyAllowancePartial(existingAllowance, allowancePartial)
        : applyAllowancePartial(
            getDefaultAllowance(allowancePartial.key),
            allowancePartial
          )
    })
  } else if (partial.allowances) {
    // Map: merge with existing, updating only specified keys
    const allowancesMap = new Map(
      rolesModifier.allowances.map((a) => [a.key, a])
    )

    for (const [key, allowancePartial] of Object.entries(partial.allowances)) {
      const existingAllowance = allowancesMap.get(key as `0x${string}`)
      const updatedAllowance = existingAllowance
        ? applyAllowancePartial(existingAllowance, allowancePartial)
        : applyAllowancePartial(
            getDefaultAllowance(key as `0x${string}`),
            allowancePartial
          )
      allowancesMap.set(key as `0x${string}`, updatedAllowance)
    }

    allowances = Array.from(allowancesMap.values())
  } else {
    allowances = rolesModifier.allowances
  }

  return {
    address: partial.address,
    owner: partial.owner ?? rolesModifier.owner,
    avatar: partial.avatar ?? rolesModifier.avatar,
    target: partial.target ?? rolesModifier.target,
    roles,
    allowances,
    multiSendAddresses:
      partial.multiSendAddresses ?? rolesModifier.multiSendAddresses,
  }
}

export function getDefaultTarget(address: `0x${string}`): Target {
  return {
    address,
    clearance: Clearance.None,
    executionOptions: ExecutionOptions.None,
    functions: [],
  }
}

export function getDefaultRole(key: `0x${string}`): Role {
  return {
    key,
    members: [],
    targets: [],
    annotations: [],
    lastUpdate: 0,
  }
}

export function getDefaultAllowance(key: `0x${string}`): Allowance {
  return {
    key,
    refill: 0n,
    maxRefill: 0n,
    period: 0n,
    balance: 0n,
    timestamp: 0n,
  }
}

export function getDefaultRolesModifier(address: `0x${string}`): RolesModifier {
  return {
    address,
    owner: "0x0000000000000000000000000000000000000000",
    avatar: "0x0000000000000000000000000000000000000000",
    target: "0x0000000000000000000000000000000000000000",
    roles: [],
    allowances: [],
    multiSendAddresses: [],
  }
}

function invariant(condition: boolean): asserts condition {
  if (!condition) {
    throw new Error("Invariant")
  }
}
