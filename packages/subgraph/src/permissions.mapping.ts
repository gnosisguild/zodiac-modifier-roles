import { AllowTarget, ScopeTarget, RevokeTarget, ScopeFunction } from "../generated/PermissionBuilder/PermissionBuilder"
import { Role, Target, RolesModifier, Function, Condition } from "../generated/schema"
import { Address, Bytes, log, store } from "@graphprotocol/graph-ts"
import {
  getFunctionId,
  getOrCreateFunction,
  getOrCreateRole,
  getOrCreateTarget,
  getConditionId,
  getRoleId,
  getRolesModifier,
  getRolesModifierId,
  getTargetId,
} from "./helpers"
import { Clearance, ExecutionOptions, Operator, ParameterType } from "./enums"

export function handleAllowTarget(event: AllowTarget): void {
  const rolesModifierAddress = event.address
  const rolesModifierId = getRolesModifierId(rolesModifierAddress)
  const rolesModifier = getRolesModifier(rolesModifierId)
  if (!rolesModifier) {
    return
  }

  const roleId = getRoleId(rolesModifierId, event.params.role)
  const role = getOrCreateRole(roleId, rolesModifierId, event.params.role)

  const targetAddress = event.params.targetAddress
  const targetId = getTargetId(roleId, targetAddress)
  const target = getOrCreateTarget(targetId, targetAddress, roleId)
  target.executionOptions = ExecutionOptions[event.params.options]
  target.clearance = Clearance[Clearance.Target]
  target.save()
}

export function handleScopeTarget(event: ScopeTarget): void {
  // adding a target to be scoped () will not have any new access yet
  const rolesModifierAddress = event.address
  const rolesModifierId = getRolesModifierId(rolesModifierAddress)
  const rolesModifier = getRolesModifier(rolesModifierId)
  if (!rolesModifier) {
    return
  }

  const roleId = getRoleId(rolesModifierId, event.params.role)
  const role = getOrCreateRole(roleId, rolesModifierId, event.params.role)

  const targetAddress = event.params.targetAddress
  const targetId = getTargetId(roleId, targetAddress)
  const target = getOrCreateTarget(targetId, targetAddress, roleId)
  target.executionOptions = ExecutionOptions[ExecutionOptions.None]
  target.clearance = Clearance[Clearance.Function]
  target.save()
}

export function handleRevokeTarget(event: RevokeTarget): void {
  const rolesModifierAddress = event.address
  const rolesModifierId = getRolesModifierId(rolesModifierAddress)
  const targetAddress = event.params.targetAddress
  const roleId = getRoleId(rolesModifierId, event.params.role)

  const targetId = getTargetId(roleId, targetAddress)
  let target = Target.load(targetId)

  if (target) {
    target.executionOptions = ExecutionOptions[ExecutionOptions.None]
    target.clearance = Clearance[Clearance.None]
    target.save()
  }
}

export function handleScopeFunction(event: ScopeFunction): void {
  // if role does not exist? create it
  const rolesModifierAddress = event.address
  const rolesModifierId = getRolesModifierId(rolesModifierAddress)
  const rolesModifier = getRolesModifier(rolesModifierId)
  if (!rolesModifier) {
    log.error("RolesModifier does not exist: {}", [rolesModifierId])
    return
  }

  const roleId = getRoleId(rolesModifierId, event.params.role)
  const role = getOrCreateRole(roleId, rolesModifierId, event.params.role)
  if (!role) {
    log.error("Roles does not exist: {}", [roleId])
    return
  }

  // If target does not exist, create it with clearance and executionOptions set to None
  const targetAddress = event.params.targetAddress
  const targetId = getTargetId(roleId, targetAddress)
  const target = getOrCreateTarget(targetId, targetAddress, roleId)

  // If function does not exist, create it with executionOptions set to None and wildcarded set to false
  const sighash = event.params.functionSig
  const functionId = getFunctionId(targetId, sighash)
  const func = getOrCreateFunction(functionId, targetId, sighash)

  // create new parameter or override old one
  for (let i = 0; i < event.params.conditions.length; i++) {
    const paramType = ParameterType[event.params.paramType[i]]
    const operator = Operator[event.params.operator[i]]
    const compValue = event.params.compValue[i]

    const parameterId = getParameterId(functionId, i)
    const parameter = new Parameter(parameterId)
    parameter.owningFunction = functionId
    parameter.index = i
    parameter.type = paramType
    parameter.comparison = paramComp
    parameter.comparisonValue = [compValue]
    parameter.save()
  }
}
