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
import { Target, Parameter } from "../generated/schema"
import { store, TypedMapEntry, Value } from "@graphprotocol/graph-ts"
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
  getRolesModifier,
  getRolesModifierId,
  getTargetId,
  PARAMETER_COMPARISON,
  PARAMETER_COMPARISON__ONE_OF,
  PARAMETER_TYPE,
} from "./helpers"

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
  target.executionOptions = EXECUTION_OPTIONS[event.params.options]
  target.clearance = CLEARANCE[CLEARANCE__TARGET]
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
  const rolesModifier = getRolesModifier(rolesModifierId)
  if (!rolesModifier) {
    return
  }

  const roleId = getRoleId(rolesModifierId, event.params.role)
  const role = getOrCreateRole(roleId, rolesModifierId, event.params.role)

  const targetAddress = event.params.targetAddress
  const targetId = getTargetId(roleId, targetAddress)
  const target = getOrCreateTarget(targetId, targetAddress, roleId)

  const sighash = event.params.selector
  const functionId = getFunctionId(targetId, sighash)
  const theFunction = getOrCreateFunction(functionId, targetId, sighash)
  theFunction.executionOptions = EXECUTION_OPTIONS[event.params.options]
  theFunction.wildcarded = true
  theFunction.save()
}

export function handleScopeFunction(event: ScopeFunction): void {
  // if role does not exist? create it
  const rolesModifierAddress = event.address
  const rolesModifierId = getRolesModifierId(rolesModifierAddress)
  const rolesModifier = getRolesModifier(rolesModifierId)
  if (!rolesModifier) {
    return
  }

  const roleId = getRoleId(rolesModifierId, event.params.role)
  const role = getOrCreateRole(roleId, rolesModifierId, event.params.role)

  // if target does not exist? create it with clearance and executionOptions set to None
  const targetAddress = event.params.targetAddress
  const targetId = getTargetId(roleId, targetAddress)
  const target = getOrCreateTarget(targetId, targetAddress, roleId)

  // if function does not exist? create it with the info from the event
  const sighash = event.params.functionSig
  const functionId = getFunctionId(targetId, sighash)
  const theFunction = getOrCreateFunction(functionId, targetId, sighash)
  theFunction.executionOptions = EXECUTION_OPTIONS[event.params.options]
  theFunction.wildcarded = false
  theFunction.save()

  if (theFunction.parameters != null) {
    // remove old parameters if it exists
    const parameters: TypedMapEntry<string, Value>[] = theFunction.parameters.entries
    for (let i = 0; i < parameters.length; i++) {
      const parameterId = parameters[i].key
      store.remove("Parameter", parameterId)
    }
  }

  for (let i = 0; i < event.params.paramType.length; i++) {
    // create new parameters
    if (event.params.isParamScoped[i]) {
      const paramType = PARAMETER_TYPE[event.params.paramType[i]]
      const paramComp = PARAMETER_COMPARISON[event.params.paramComp[i]]
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
}

export function handleScopeFunctionExecutionOptions(event: ScopeFunctionExecutionOptions): void {
  const rolesModifierAddress = event.address
  const rolesModifierId = getRolesModifierId(rolesModifierAddress)
  const rolesModifier = getRolesModifier(rolesModifierId)
  if (!rolesModifier) {
    return
  }

  const roleId = getRoleId(rolesModifierId, event.params.role)
  getOrCreateRole(roleId, rolesModifierId, event.params.role)
  const targetAddress = event.params.targetAddress
  const targetId = getTargetId(roleId, targetAddress)
  getOrCreateTarget(targetId, targetAddress, roleId)
  const sighash = event.params.functionSig
  const functionId = getFunctionId(targetId, sighash)
  const theFunction = getOrCreateFunction(functionId, targetId, sighash)
  theFunction.executionOptions = EXECUTION_OPTIONS[event.params.options]
  theFunction.save()
}

export function handleScopeParameter(event: ScopeParameter): void {
  const rolesModifierAddress = event.address
  const rolesModifierId = getRolesModifierId(rolesModifierAddress)
  const rolesModifier = getRolesModifier(rolesModifierId)
  if (!rolesModifier) {
    return
  }

  const roleId = getRoleId(rolesModifierId, event.params.role)
  getOrCreateRole(roleId, rolesModifierId, event.params.role)
  const targetAddress = event.params.targetAddress
  const targetId = getTargetId(roleId, targetAddress)
  getOrCreateTarget(targetId, targetAddress, roleId)
  const sighash = event.params.functionSig
  const functionId = getFunctionId(targetId, sighash)
  const theFunction = getOrCreateFunction(functionId, targetId, sighash)

  const parameterId = getParameterId(functionId, event.params.index.toI32())
  const parameter = new Parameter(parameterId) // will always overwrite the parameter
  const paramType = PARAMETER_TYPE[event.params.paramType]
  const paramComp = PARAMETER_COMPARISON[event.params.paramComp]
  const compValue = event.params.compValue // Can't be decode here, we do not have the required info (target ABI), must be done in frontend.
  parameter.owningFunction = functionId
  parameter.index = event.params.index.toI32()
  parameter.type = paramType
  parameter.comparison = paramComp
  parameter.comparisonValue = [compValue]
  parameter.save()
}

export function handleScopeParameterAsOneOf(event: ScopeParameterAsOneOf): void {
  const rolesModifierAddress = event.address
  const rolesModifierId = getRolesModifierId(rolesModifierAddress)
  const rolesModifier = getRolesModifier(rolesModifierId)
  if (!rolesModifier) {
    return
  }

  const roleId = getRoleId(rolesModifierId, event.params.role)
  getOrCreateRole(roleId, rolesModifierId, event.params.role)
  const targetAddress = event.params.targetAddress
  const targetId = getTargetId(roleId, targetAddress)
  getOrCreateTarget(targetId, targetAddress, roleId)
  const sighash = event.params.functionSig
  const functionId = getFunctionId(targetId, sighash)
  const theFunction = getOrCreateFunction(functionId, targetId, sighash)

  const parameterId = getParameterId(functionId, event.params.index.toI32())
  const parameter = new Parameter(parameterId) // will always overwrite the parameter
  const paramType = PARAMETER_TYPE[event.params.paramType]
  const paramComp = PARAMETER_COMPARISON[PARAMETER_COMPARISON__ONE_OF]
  const compValues = event.params.compValues

  parameter.owningFunction = functionId
  parameter.index = event.params.index.toI32()
  parameter.type = paramType
  parameter.comparison = paramComp
  parameter.comparisonValue = compValues
  parameter.save()
}

export function handleScopeRevokeFunction(event: ScopeRevokeFunction): void {
  // remove function
  const rolesModifierAddress = event.address
  const rolesModifierId = getRolesModifierId(rolesModifierAddress)
  const targetAddress = event.params.targetAddress
  const roleId = getRoleId(rolesModifierId, event.params.role)
  const targetId = getTargetId(roleId, targetAddress)
  const sighash = event.params.selector
  const functionId = getFunctionId(targetId, sighash)

  store.remove("Function", functionId)
}

export function handleUnscopeParameter(event: UnscopeParameter): void {
  const rolesModifierAddress = event.address
  const rolesModifierId = getRolesModifierId(rolesModifierAddress)
  const rolesModifier = getRolesModifier(rolesModifierId)
  if (!rolesModifier) {
    return
  }

  const roleId = getRoleId(rolesModifierId, event.params.role)
  const targetAddress = event.params.targetAddress
  const targetId = getTargetId(roleId, targetAddress)
  const sighash = event.params.functionSig
  const functionId = getFunctionId(targetId, sighash)
  const parameterId = getParameterId(functionId, event.params.index.toI32())

  store.remove("Parameter", parameterId)
}
