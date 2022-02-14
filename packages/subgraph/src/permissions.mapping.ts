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
import {
  CLEARANCE,
  CLEARANCE__FUNCTION,
  CLEARANCE__NONE,
  CLEARANCE__TARGET,
  EXECUTION_OPTIONS,
  EXECUTION_OPTIONS__NONE,
  getFunctionId,
  getRoleId,
  getRolesModifierId,
  getTargetId,
} from "./helpers"

export function handleAllowTarget(event: AllowTarget): void {
  const rolesModifierAddress = event.address
  const rolesModifierId = getRolesModifierId(rolesModifierAddress)
  let rolesModifier = RolesModifier.load(rolesModifierId)
  if (!rolesModifier) {
    log.info("This event is not for any of our rolesModifiers. A roles modifier with that address does not exist", [
      rolesModifierId,
    ])
    return
  }

  const targetAddress = event.params.targetAddress

  const roleId = getRoleId(rolesModifierId, event.params.role)
  let role = Role.load(roleId)

  // save role if this is the first time we encounter it
  if (!role) {
    role = new Role(roleId)
    role.name = event.params.role.toString()
    role.rolesModifier = rolesModifierId
    role.save()
  }

  const targetId = getTargetId(roleId, targetAddress)
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
  const rolesModifierId = getRolesModifierId(rolesModifierAddress)
  const targetAddress = event.params.targetAddress

  const roleId = getRoleId(rolesModifierId, event.params.role)

  const targetId = getTargetId(roleId, targetAddress)
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
  const rolesModifierId = getRolesModifierId(rolesModifierAddress)
  const targetAddress = event.params.targetAddress
  const roleId = getRoleId(rolesModifierId, event.params.role)

  const targetId = getTargetId(roleId, targetAddress)
  store.remove("Target", targetId)
}

export function handleScopeAllowFunction(event: ScopeAllowFunction): void {
  // allow function
  const rolesModifierAddress = event.address
  const rolesModifierId = getRolesModifierId(rolesModifierAddress)
  const targetAddress = event.params.targetAddress
  const functionSig = event.params.selector
  const roleId = getRoleId(rolesModifierId, event.params.role)
  const targetId = getTargetId(roleId, targetAddress)

  let target = Target.load(targetId)

  if (!target) {
    // creating a target before scopeTarget (will not be executable, before the target's clearance is set via scopeTarget())
    target = new Target(targetId)
    target.address = targetAddress
    target.role = roleId
    target.executionOptions = EXECUTION_OPTIONS[EXECUTION_OPTIONS__NONE]
    target.clearance = CLEARANCE[CLEARANCE__NONE]
  }

  const functionId = getFunctionId(targetId, functionSig)

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

export function handleScopeFunction(event: ScopeFunction): void {}

export function handleScopeFunctionExecutionOptions(event: ScopeFunctionExecutionOptions): void {}

export function handleScopeParameter(event: ScopeParameter): void {}

export function handleScopeParameterAsOneOf(event: ScopeParameterAsOneOf): void {}

export function handleScopeRevokeFunction(event: ScopeRevokeFunction): void {
  // remove function
  const rolesModifierAddress = event.address
  const rolesModifierId = getRolesModifierId(rolesModifierAddress)
  const targetAddress = event.params.targetAddress
  const roleId = getRoleId(rolesModifierId, event.params.role)
  const targetId = getTargetId(roleId, targetAddress)
  const functionSig = event.params.selector
  const functionId = getFunctionId(targetId, functionSig)

  store.remove("Function", functionId)
}

export function handleUnscopeParameter(event: UnscopeParameter): void {}
