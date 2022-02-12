import {
  AllowTarget,
  ScopeTarget,
  RevokeTarget,
  ScopeAllowFunction,
  ScopeFunction,
  ScopeFunctionExecutionOptions,
  ScopeParameter,
  ScopeParameterAsOneOf,
  ScopeRevokeFunction,
  UnscopeParameter,
} from "../generated/Permissions/Permissions"
import { Role, Target, RolesModifier } from "../generated/schema"
import { log, store } from "@graphprotocol/graph-ts"

const ExecutionOptions = ["None", "Send", "DelegateCall", "Both"]
const EXECUTION_OPTIONS__NONE = 0
const EXECUTION_OPTIONS__SEND = 1
const EXECUTION_OPTIONS__DELEGATE_CALL = 2
const EXECUTION_OPTIONS__BOTH = 3

const Clearance = ["None", "Target", "Function"]
const CLEARANCE__NONE = 0
const CLEARANCE__TARGET = 1
const CLEARANCE__FUNCTION = 2

export function handleAllowTarget(event: AllowTarget): void {
  const rolesModifierAddress = event.address
  let rolesModifierId = rolesModifierAddress.toHexString()
  let rolesModifier = RolesModifier.load(rolesModifierId)

  if (!rolesModifier) {
    log.error("RolesModifier not found", [rolesModifierId])
    return
  }

  const roleId = event.params.role.toString()
  let role = Role.load(roleId)

  if (!role) {
    role = new Role(roleId)
    role.rolesModifier = rolesModifierId
    role.save()
  }

  const targetId = event.params.targetAddress.toHex() + "-" + event.params.role.toString()
  let target = Target.load(targetId)

  if (!target) {
    target = new Target(targetId)
    target.address = event.params.targetAddress
    target.role = roleId
  }
  target.executionOptions = ExecutionOptions[event.params.options]
  target.clearance = Clearance[CLEARANCE__TARGET]
  target.save()
}

export function handleScopeTarget(event: ScopeTarget): void {
  // adding a target to be scoped ()
}

export function handleRevokeTarget(event: RevokeTarget): void {
  // remove target
  const targetId = event.params.targetAddress.toHex() + "-" + event.params.role.toString()
  store.remove("Target", targetId)
}

export function handleScopeAllowFunction(event: ScopeAllowFunction): void {}

export function handleScopeFunction(event: ScopeFunction): void {}

export function handleScopeFunctionExecutionOptions(event: ScopeFunctionExecutionOptions): void {}

export function handleScopeParameter(event: ScopeParameter): void {}

export function handleScopeParameterAsOneOf(event: ScopeParameterAsOneOf): void {}

export function handleScopeRevokeFunction(event: ScopeRevokeFunction): void {}

export function handleUnscopeParameter(event: UnscopeParameter): void {}
