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
import { Role, Module, Target } from "../generated/schema"

export function handleAllowTarget(event: AllowTarget): void {
  const roleId = event.params.role.toString()
  let role = Role.load(roleId)
  const rolesModifierAddress = event.address
  const safeAddress = event.transaction.from

  if (!role) {
    role = new Role(roleId)
    role.save()
  }

  const targetId = event.params.role.toString() + "-" + event.params.targetAddress.toHex()
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
