import {
  AllowTarget,
  ScopeTarget,
  RevokeTarget,
  ScopeFunction,
  RevokeFunction,
  SetAllowance,
  AllowFunction,
} from "../generated/PermissionBuilder/PermissionBuilder"
import { Target } from "../generated/schema"
import { log, store } from "@graphprotocol/graph-ts"
import {
  getFunctionId,
  getOrCreateAllowance,
  getOrCreateFunction,
  getOrCreateRole,
  getOrCreateTarget,
  getRoleId,
  getRolesModifier,
  getRolesModifierId,
  getTargetId,
} from "./helpers"
import { Clearance, ExecutionOptions, Operator, ParameterType } from "./enums"
import { storeConditions } from "./conditions"

export function handleAllowTarget(event: AllowTarget): void {
  const rolesModifierAddress = event.address
  const rolesModifierId = getRolesModifierId(rolesModifierAddress)
  const rolesModifier = getRolesModifier(rolesModifierId)
  if (!rolesModifier) {
    log.error("RolesModifier does not exist: {}", [rolesModifierId])
    return
  }

  // Make sure the role exists
  const roleId = getRoleId(rolesModifierId, event.params.roleKey)
  getOrCreateRole(roleId, rolesModifierId, event.params.roleKey)

  const targetAddress = event.params.targetAddress
  const targetId = getTargetId(roleId, targetAddress)
  const target = getOrCreateTarget(targetId, targetAddress, roleId)
  target.executionOptions = ExecutionOptions[event.params.options]
  target.clearance = Clearance[Clearance.Target]
  target.save()

  log.info("Permission has been granted to call any function of target {}", [targetId])
}

export function handleScopeTarget(event: ScopeTarget): void {
  // adding a target to be scoped () will not have any new access yet
  const rolesModifierAddress = event.address
  const rolesModifierId = getRolesModifierId(rolesModifierAddress)
  const rolesModifier = getRolesModifier(rolesModifierId)
  if (!rolesModifier) {
    log.error("RolesModifier does not exist: {}", [rolesModifierId])
    return
  }

  // Make sure the role exists
  const roleId = getRoleId(rolesModifierId, event.params.roleKey)
  getOrCreateRole(roleId, rolesModifierId, event.params.roleKey)

  const targetAddress = event.params.targetAddress
  const targetId = getTargetId(roleId, targetAddress)
  const target = getOrCreateTarget(targetId, targetAddress, roleId)
  target.executionOptions = ExecutionOptions[ExecutionOptions.None]
  target.clearance = Clearance[Clearance.Function]
  target.save()

  log.info("Target {} has been set to scoped", [targetId])
}

export function handleRevokeTarget(event: RevokeTarget): void {
  const rolesModifierAddress = event.address
  const rolesModifierId = getRolesModifierId(rolesModifierAddress)
  const targetAddress = event.params.targetAddress
  const roleId = getRoleId(rolesModifierId, event.params.roleKey)

  const targetId = getTargetId(roleId, targetAddress)
  let target = Target.load(targetId)

  if (target) {
    target.executionOptions = ExecutionOptions[ExecutionOptions.None]
    target.clearance = Clearance[Clearance.None]
    target.save()
  } else {
    log.warning("Target does not exist: {}", [targetId])
  }

  log.info("Permission to call target {} has been revoked", [targetId])
}

export function handleAllowFunction(event: AllowFunction): void {
  const rolesModifierId = getRolesModifierId(event.address)
  const rolesModifier = getRolesModifier(rolesModifierId)
  if (!rolesModifier) {
    log.error("RolesModifier does not exist: {}", [rolesModifierId])
    return
  }

  // Make sure the role exists
  const roleId = getRoleId(rolesModifierId, event.params.roleKey)
  getOrCreateRole(roleId, rolesModifierId, event.params.roleKey)

  // Make sure the target exists
  const targetAddress = event.params.targetAddress
  const targetId = getTargetId(roleId, targetAddress)
  getOrCreateTarget(targetId, targetAddress, roleId)

  const functionId = getFunctionId(targetId, event.params.selector)
  const func = getOrCreateFunction(functionId, targetId, event.params.selector)
  func.wildcarded = true
  func.executionOptions = ExecutionOptions[event.params.options]
  func.condition = null
  func.save()

  log.info("Wildcard permission to call {} has been granted", [functionId])
}

export function handleScopeFunction(event: ScopeFunction): void {
  const rolesModifierId = getRolesModifierId(event.address)
  const rolesModifier = getRolesModifier(rolesModifierId)
  if (!rolesModifier) {
    log.error("RolesModifier does not exist: {}", [rolesModifierId])
    return
  }

  // Make sure the role exists
  const roleId = getRoleId(rolesModifierId, event.params.roleKey)
  getOrCreateRole(roleId, rolesModifierId, event.params.roleKey)

  // Make sure the target exists
  const targetAddress = event.params.targetAddress
  const targetId = getTargetId(roleId, targetAddress)
  getOrCreateTarget(targetId, targetAddress, roleId)

  // If function does not exist, create it with executionOptions set to None and wildcarded set to false
  const selector = event.params.selector
  const functionId = getFunctionId(targetId, selector)
  const func = getOrCreateFunction(functionId, targetId, selector)

  // Store the conditions and reference the root condition from the function
  assert(event.params.conditions.length > 0, "Conditions must not be empty")
  const rootCondition = storeConditions(event.params.conditions)
  func.condition = rootCondition.id
  func.save()

  log.info("Function {} has been scoped with condition {}", [functionId, rootCondition.id])
}

export function handleRevokeFunction(event: RevokeFunction): void {
  const rolesModifierAddress = event.address
  const rolesModifierId = getRolesModifierId(rolesModifierAddress)
  const targetAddress = event.params.targetAddress
  const roleId = getRoleId(rolesModifierId, event.params.roleKey)

  const targetId = getTargetId(roleId, targetAddress)
  const functionId = getFunctionId(targetId, event.params.selector)
  store.remove("Function", functionId)

  log.info("Permissions to call function {} have been revoked", [functionId])
}

export function handleSetAllowance(event: SetAllowance): void {
  const rolesModifierAddress = event.address
  const rolesModifierId = getRolesModifierId(rolesModifierAddress)
  const rolesModifier = getRolesModifier(rolesModifierId)
  if (!rolesModifier) {
    log.error("RolesModifier does not exist: {}", [rolesModifierId])
    return
  }

  const allowance = getOrCreateAllowance(event.params.allowanceKey, rolesModifierId)
  allowance.balance = event.params.balance
  allowance.maxBalance = event.params.balance
  allowance.refillAmount = event.params.refillAmount
  allowance.refillInterval = event.params.refillInterval.toU32()
  allowance.refillTimestamp = event.params.refillTimestamp.toU32()
  allowance.save()

  log.info("Allowance {} has been set", [allowance.id])
}
