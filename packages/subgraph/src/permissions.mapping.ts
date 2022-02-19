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
import { Role, Target, RolesModifier, Function, Parameter } from "../generated/schema"
import { Address, Bytes, log, store } from "@graphprotocol/graph-ts"
import {
  CLEARANCE,
  CLEARANCE__FUNCTION,
  CLEARANCE__NONE,
  CLEARANCE__TARGET,
  EXECUTION_OPTIONS,
  EXECUTION_OPTIONS__NONE,
  getFunctionId,
  getOrCreateFunction,
  getOrCreateRole,
  getOrCreateTarget,
  getParameterId,
  getRoleId,
  getRolesModifierId,
  getTargetId,
  PARAMETER_COMPARISON,
  PARAMETER_TYPE,
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

  const roleId = getRoleId(rolesModifierId, event.params.role)
  const role = getOrCreateRole(roleId, rolesModifierId, event.params.role)

  const targetAddress = event.params.targetAddress
  const targetId = getTargetId(roleId, targetAddress)
  const target = getOrCreateTarget(targetId, targetAddress, roleId)
  target.executionOptions = EXECUTION_OPTIONS[event.params.options]
  target.clearance = CLEARANCE[CLEARANCE__TARGET]
  target.save()
}

export function handleScopeTarget(event: ScopeTarget): void {
  // adding a target to be scoped () will not have any new access yet
  const rolesModifierAddress = event.address
  const rolesModifierId = getRolesModifierId(rolesModifierAddress)
  const roleId = getRoleId(rolesModifierId, event.params.role)
  const role = getOrCreateRole(roleId, rolesModifierId, event.params.role)

  const targetAddress = event.params.targetAddress
  const targetId = getTargetId(roleId, targetAddress)
  const target = getOrCreateTarget(targetId, targetAddress, roleId)
  target.executionOptions = EXECUTION_OPTIONS[EXECUTION_OPTIONS__NONE]
  target.clearance = CLEARANCE[CLEARANCE__FUNCTION]
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
    target.executionOptions = EXECUTION_OPTIONS[EXECUTION_OPTIONS__NONE]
    target.clearance = CLEARANCE[CLEARANCE__NONE]
    target.save()
  }
}

export function handleScopeAllowFunction(event: ScopeAllowFunction): void {
  // allow function
  const rolesModifierAddress = event.address
  const rolesModifierId = getRolesModifierId(rolesModifierAddress)
  const roleId = getRoleId(rolesModifierId, event.params.role)
  const role = getOrCreateRole(roleId, rolesModifierId, event.params.role)

  const targetAddress = event.params.targetAddress
  const targetId = getTargetId(roleId, targetAddress)
  const target = getOrCreateTarget(targetId, targetAddress, roleId)

  const functionSig = event.params.selector
  const functionId = getFunctionId(targetId, functionSig)
  const theFunction = getOrCreateFunction(functionId, targetId, functionSig)
  theFunction.executionOptions = EXECUTION_OPTIONS[event.params.options]
  theFunction.wildcarded = true
  theFunction.save()
}

export function handleScopeFunction(event: ScopeFunction): void {
  // if role does not exist? create it
  const rolesModifierAddress = event.address
  const rolesModifierId = getRolesModifierId(rolesModifierAddress)
  const roleId = getRoleId(rolesModifierId, event.params.role)
  const role = getOrCreateRole(roleId, rolesModifierId, event.params.role)

  // if target does not exist? create it with clearance and executionOptions set to None
  const targetAddress = event.params.targetAddress
  const targetId = getTargetId(roleId, targetAddress)
  const target = getOrCreateTarget(targetId, targetAddress, roleId)

  // if function does not exist? create it with the info from the event
  const functionSig = event.params.functionSig
  const functionId = getFunctionId(targetId, functionSig)
  const theFunction = getOrCreateFunction(functionId, targetId, functionSig)
  theFunction.executionOptions = EXECUTION_OPTIONS[event.params.options]
  theFunction.save()

  // create new parameter or override old one
  for (let i = 0; i < event.params.paramType.length; i++) {
    const paramType = PARAMETER_TYPE[event.params.paramType[i]]
    const paramComp = PARAMETER_COMPARISON[event.params.paramComp[i]]
    const compValue = event.params.compValue[i]

    const parameterId = getParameterId(functionId, i)
    const parameter = new Parameter(parameterId)
    parameter.theFunction = functionId
    parameter.parameterIndex = i
    parameter.parameterType = paramType
    parameter.parameterComparison = paramComp
    parameter.parameterComparisonValue = compValue
    parameter.save()
  }
}

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
