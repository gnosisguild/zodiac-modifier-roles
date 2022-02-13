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
import { Role, Target, RolesModifier, Function } from "../generated/schema"
import { Address, Bytes, log, store } from "@graphprotocol/graph-ts"

const EXECUTION_OPTIONS = ["None", "Send", "DelegateCall", "Both"]
const EXECUTION_OPTIONS__NONE = 0
const EXECUTION_OPTIONS__SEND = 1
const EXECUTION_OPTIONS__DELEGATE_CALL = 2
const execution_options__both = 3

const CLEARANCE = ["none", "target", "function"]
const CLEARANCE__NONE = 0
const CLEARANCE__TARGET = 1
const CLEARANCE__FUNCTION = 2

export function handleAllowTarget(event: AllowTarget): void {
  const rolesModifierAddress = event.address
  const targetAddress = event.params.targetAddress

  const roleId = getRoleId(rolesModifierAddress, event.params.role)

  let rolesModifierId = getRolesModifierId(rolesModifierAddress)
  let role = Role.load(roleId)

  // save role if this is the first time we encounter it
  if (!role) {
    role = new Role(roleId)
    role.rolesModifier = rolesModifierId
    role.save()
  }

  const targetId = getTargetId(rolesModifierAddress, roleId, targetAddress)
  let target = Target.load(targetId)

  if (!target) {
    target = new Target(targetId)
    target.address = targetAddress
    target.role = roleId
  }
  target.executionOptions = EXECUTION_OPTIONS[event.params.options]
  target.clearance = CLEARANCE[CLEARANCE__TARGET]
  target.save()
}

export function handleScopeTarget(event: ScopeTarget): void {
  // adding a target to be scoped () will not have any new access yet
  const rolesModifierAddress = event.address
  const targetAddress = event.params.targetAddress

  const roleId = getRoleId(rolesModifierAddress, event.params.role)

  const targetId = getTargetId(rolesModifierAddress, roleId, targetAddress)
  let target = Target.load(targetId)

  if (!target) {
    target = new Target(targetId)
    target.address = targetAddress
    target.role = roleId
  }
  target.executionOptions = EXECUTION_OPTIONS[EXECUTION_OPTIONS__NONE]
  target.clearance = CLEARANCE[CLEARANCE__FUNCTION]
  target.save()
}

export function handleRevokeTarget(event: RevokeTarget): void {
  // remove target
  const rolesModifierAddress = event.address
  const targetAddress = event.params.targetAddress
  const roleId = getRoleId(rolesModifierAddress, event.params.role)

  const targetId = getTargetId(rolesModifierAddress, roleId, targetAddress)
  store.remove("Target", targetId)
}

export function handleScopeAllowFunction(event: ScopeAllowFunction): void {
  // allow function
  const rolesModifierAddress = event.address
  const targetAddress = event.params.targetAddress
  const functionSig = event.params.selector
  const roleId = getRoleId(rolesModifierAddress, event.params.role)
  const targetId = getTargetId(rolesModifierAddress, roleId, targetAddress)

  let target = Target.load(targetId)

  if (!target) {
    // creating a target before scopeTarget (will not be executable, before the target's clearance is set via scopeTarget())
    target = new Target(targetId)
    target.address = targetAddress
    target.role = roleId
    target.executionOptions = EXECUTION_OPTIONS[EXECUTION_OPTIONS__NONE]
    target.clearance = CLEARANCE[CLEARANCE__NONE]
  }

  const functionId = getFunctionId(rolesModifierAddress, roleId, targetAddress, functionSig)

  let theFunction = Function.load(functionId)

  if (!theFunction) {
    theFunction = new Function(functionId)
    theFunction.target = targetId
    theFunction.functionSig = functionSig
    theFunction.executionOptions = EXECUTION_OPTIONS[event.params.options]
    theFunction.wildcarded = true
    target.save()
  } else {
    log.warning("Function already exists", [functionId])
  }
}

export function handleScopeFunction(event: ScopeFunction): void {
  // allow functions
}

export function handleScopeFunctionExecutionOptions(event: ScopeFunctionExecutionOptions): void {}

export function handleScopeParameter(event: ScopeParameter): void {}

export function handleScopeParameterAsOneOf(event: ScopeParameterAsOneOf): void {}

export function handleScopeRevokeFunction(event: ScopeRevokeFunction): void {
  // remove function
  const rolesModifierAddress = event.address
  const targetAddress = event.params.targetAddress
  const roleId = getRoleId(rolesModifierAddress, event.params.role)
  const functionSig = event.params.selector
  const functionId = getFunctionId(rolesModifierAddress, roleId, targetAddress, functionSig)

  store.remove("Function", functionId)
}

export function handleUnscopeParameter(event: UnscopeParameter): void {}

// helpers
const getRolesModifierId = (rolesModifier: Address): string => rolesModifier.toHexString()
const getRoleId = (roleModifier: Address, role: number): string => roleModifier.toHex() + "-" + role.toString()
const getTargetId = (rolesModifier: Address, roleId: string, target: Address): string =>
  rolesModifier.toHex() + target.toHex() + "-" + roleId

const getFunctionId = (rolesModifier: Address, roleId: string, target: Address, functionSig: Bytes): string =>
  rolesModifier.toHex() + target.toHex() + "-" + roleId + "-" + functionSig.toHex()
