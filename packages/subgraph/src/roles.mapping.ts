import { BigInt } from "@graphprotocol/graph-ts"
import {
  Roles,
  AssignRoles,
  AvatarSet,
  ChangedGuard,
  DisabledModule,
  EnabledModule,
  OwnershipTransferred,
  RolesModSetup,
  SetDefaultRole,
  SetMultisendAddress,
  TargetSet,
} from "../generated/Roles/Roles"
import { RolesModifier } from "../generated/schema"
import { log } from '@graphprotocol/graph-ts'

export function handleAssignRoles(event: AssignRoles): void {}

export function handleAvatarSet(event: AvatarSet): void {}

export function handleChangedGuard(event: ChangedGuard): void {}

export function handleDisabledModule(event: DisabledModule): void {}

export function handleEnabledModule(event: EnabledModule): void {}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {}

export function handleRolesModSetup(event: RolesModSetup): void {
  const rolesModifierAddress = event.address
  let rolesModifierId = rolesModifierAddress.toHexString()
  let rolesModifier = RolesModifier.load(rolesModifierId)

  if (rolesModifier) {
    log.error("RolesModifier already exists", [rolesModifierId])
  }
  rolesModifier = new RolesModifier(rolesModifierId)
  rolesModifier.address = rolesModifierAddress
  rolesModifier.owner = event.params.owner
  rolesModifier.avatar = event.params.avatar
  rolesModifier.exec_target = event.params.target
  rolesModifier.save()
}

export function handleSetDefaultRole(event: SetDefaultRole): void {}

export function handleSetMultisendAddress(event: SetMultisendAddress): void {}

export function handleTargetSet(event: TargetSet): void {}
