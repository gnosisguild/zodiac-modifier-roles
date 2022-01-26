import { BigInt } from "@graphprotocol/graph-ts"
import {
  Permissions,
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
import { log } from "@graphprotocol/graph-ts"

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
    target.save()
  }
}

export function handleScopeTarget(event: ScopeTarget): void {}

export function handleRevokeTarget(event: RevokeTarget): void {}

export function handleScopeAllowFunction(event: ScopeAllowFunction): void {}

export function handleScopeFunction(event: ScopeFunction): void {}

export function handleScopeFunctionExecutionOptions(event: ScopeFunctionExecutionOptions): void {}

export function handleScopeParameter(event: ScopeParameter): void {}

export function handleScopeParameterAsOneOf(event: ScopeParameterAsOneOf): void {}

export function handleScopeRevokeFunction(event: ScopeRevokeFunction): void {}

export function handleUnscopeParameter(event: UnscopeParameter): void {}
