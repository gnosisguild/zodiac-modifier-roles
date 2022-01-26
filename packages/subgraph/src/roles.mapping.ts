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

export function handleAssignRoles(event: AssignRoles): void {}

export function handleAvatarSet(event: AvatarSet): void {}

export function handleChangedGuard(event: ChangedGuard): void {}

export function handleDisabledModule(event: DisabledModule): void {}

export function handleEnabledModule(event: EnabledModule): void {}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {}

export function handleRolesModSetup(event: RolesModSetup): void {}

export function handleSetDefaultRole(event: SetDefaultRole): void {}

export function handleSetMultisendAddress(event: SetMultisendAddress): void {}

export function handleTargetSet(event: TargetSet): void {}
