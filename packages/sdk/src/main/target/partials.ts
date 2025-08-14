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

const AddressZero = "0x0000000000000000000000000000000000000000"
const HashZero =
  "0x0000000000000000000000000000000000000000000000000000000000000000"

export function spreadTargetPartial(
  target: Target | undefined | null,
  partial: TargetPartial
): Target {
  if (target) invariant(target.address === partial.address)
  else target = defaultTarget

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

export function spreadRolePartial(
  role: Role | undefined | null,
  partial: RolePartial
): Role {
  if (role) invariant(role.key == partial.key)
  else role = defaultRole

  let targets: Target[]

  if (Array.isArray(partial.targets)) {
    // Array replaces entirely
    targets = partial.targets.map((targetPartial) => {
      const existingTarget = role.targets.find(
        (t) => t.address === targetPartial.address
      )
      return spreadTargetPartial(existingTarget, targetPartial)
    })
  } else if (partial.targets) {
    // Map: merge with existing, updating only specified addresses
    const targetsMap = new Map(role.targets.map((t) => [t.address, t]))

    for (const [address, targetPartial] of Object.entries(partial.targets)) {
      const existingTarget = targetsMap.get(address as `0x${string}`)
      const updatedTarget = spreadTargetPartial(existingTarget, targetPartial)

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

export function spreadAllowancePartial(
  allowance: Allowance | undefined | null,
  partial: AllowancePartial
): Allowance {
  if (allowance) invariant(allowance.key === partial.key)
  else allowance = defaultAllowance

  return {
    key: partial.key,
    refill: partial.refill ?? allowance.refill,
    maxRefill: partial.maxRefill ?? allowance.maxRefill,
    period: partial.period ?? allowance.period,
    balance: partial.balance ?? allowance.balance,
    timestamp: partial.timestamp ?? allowance.timestamp,
  }
}

export function spreadRolesModifierPartial(
  rolesModifier: RolesModifier | undefined | null,
  partial: RolesModifierPartial
): RolesModifier {
  if (rolesModifier) invariant(rolesModifier.address === partial.address)
  else rolesModifier = defaultRolesModifier

  let roles: Role[]
  let allowances: Allowance[]

  if (Array.isArray(partial.roles)) {
    // Array replaces entirely
    roles = partial.roles.map((rolePartial) => {
      const existingRole = rolesModifier.roles.find(
        (r) => r.key === rolePartial.key
      )
      return spreadRolePartial(existingRole, rolePartial)
    })
  } else if (partial.roles) {
    // Map: merge with existing, updating only specified keys
    const rolesMap = new Map(rolesModifier.roles.map((r) => [r.key, r]))

    for (const [key, rolePartial] of Object.entries(partial.roles)) {
      const existingRole = rolesMap.get(key as `0x${string}`)
      const updatedRole = spreadRolePartial(existingRole, rolePartial)

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
      return spreadAllowancePartial(existingAllowance, allowancePartial)
    })
  } else if (partial.allowances) {
    // Map: merge with existing, updating only specified keys
    const allowancesMap = new Map(
      rolesModifier.allowances.map((a) => [a.key, a])
    )

    for (const [key, allowancePartial] of Object.entries(partial.allowances)) {
      const updatedAllowance = spreadAllowancePartial(
        allowancesMap.get(key as `0x${string}`),
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

const defaultTarget: Target = {
  address: AddressZero,
  clearance: Clearance.None,
  executionOptions: ExecutionOptions.None,
  functions: [],
}

const defaultRole: Role = {
  key: HashZero,
  members: [],
  targets: [],
  annotations: [],
  lastUpdate: 0,
}

const defaultAllowance: Allowance = {
  key: HashZero,
  refill: 0n,
  maxRefill: 0n,
  period: 0n,
  balance: 0n,
  timestamp: 0n,
}

const defaultRolesModifier: RolesModifier = {
  address: AddressZero,
  owner: "0x0000000000000000000000000000000000000000",
  avatar: "0x0000000000000000000000000000000000000000",
  target: "0x0000000000000000000000000000000000000000",
  roles: [],
  allowances: [],
  multiSendAddresses: [],
}

function invariant(condition: boolean): asserts condition {
  if (!condition) {
    throw new Error("Invariant")
  }
}
