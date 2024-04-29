import {
  AssignRoles,
  AvatarSet,
  DisabledModule,
  EnabledModule,
  OwnershipTransferred,
  RolesModSetup,
  SetDefaultRole,
  TargetSet,
} from "../generated/Roles/Roles"
import { RolesModifier, RoleAssignment } from "../generated/schema"
import { log, store } from "@graphprotocol/graph-ts"
import {
  getMemberId,
  getAssignmentId,
  getOrCreateMember,
  getOrCreateRole,
  getRoleId,
  getRolesModifierId,
  getRolesModifier,
} from "./helpers"

export function handleAssignRoles(event: AssignRoles): void {
  // add and remove member from roles
  const rolesModifierAddress = event.address
  const rolesModifierId = getRolesModifierId(rolesModifierAddress)
  const rolesModifier = getRolesModifier(rolesModifierId)
  if (!rolesModifier) {
    return
  }

  const memberAddress = event.params.module
  const memberId = getMemberId(rolesModifierId, memberAddress)
  getOrCreateMember(memberId, rolesModifierId, memberAddress) // create member if it does not exist

  const roleKeys = event.params.roleKeys
  const memberOfArray = event.params.memberOf

  for (let i = 0; i < roleKeys.length; i++) {
    const roleId = getRoleId(rolesModifierId, roleKeys[i])
    const role = getOrCreateRole(roleId, rolesModifierId, roleKeys[i])
    const assignmentId = getAssignmentId(memberId, roleId)
    let assignment = RoleAssignment.load(assignmentId)
    if (!assignment) {
      if (memberOfArray[i]) {
        // adding a member
        assignment = new RoleAssignment(assignmentId)
        assignment.member = memberId
        assignment.role = roleId
        assignment.save()
      } else {
        // nothing to do the member - role relationship does not exist
        log.warning("Trying to remove member {} from role #{}, but it's not a member", [memberId, roleId])
      }
    } else {
      if (memberOfArray[i]) {
        // adding a member that is already a member
        log.warning("Trying to add member {} to role #{}, but it already is a member", [memberId, roleId])
      } else {
        // removing a member-role relationship
        store.remove("RoleAssignment", assignmentId)
      }
    }
  }
}

export function handleDisabledModule(event: DisabledModule): void {
  const rolesModifierAddress = event.address
  const rolesModifierId = getRolesModifierId(rolesModifierAddress)
  const rolesModifier = getRolesModifier(rolesModifierId)
  if (!rolesModifier) {
    return
  }

  const memberAddress = event.params.module
  const memberId = getMemberId(rolesModifierId, memberAddress)
  const member = getOrCreateMember(memberId, rolesModifierId, memberAddress)
  member.enabledAsModule = false
  member.save()
}

export function handleEnabledModule(event: EnabledModule): void {
  const rolesModifierAddress = event.address
  const rolesModifierId = getRolesModifierId(rolesModifierAddress)
  const rolesModifier = getRolesModifier(rolesModifierId)
  if (!rolesModifier) {
    return
  }

  const memberAddress = event.params.module
  const memberId = getMemberId(rolesModifierId, memberAddress)
  const member = getOrCreateMember(memberId, rolesModifierId, memberAddress)
  member.enabledAsModule = true
  member.save()
}

export function handleRolesModSetup(event: RolesModSetup): void {
  const rolesModifierAddress = event.address
  const rolesModifierId = getRolesModifierId(rolesModifierAddress)
  let rolesModifier = RolesModifier.load(rolesModifierId)

  if (!rolesModifier) {
    rolesModifier = new RolesModifier(rolesModifierId)
    rolesModifier.address = rolesModifierAddress
    rolesModifier.owner = event.params.owner
    rolesModifier.avatar = event.params.avatar
    rolesModifier.target = event.params.target
    rolesModifier.save()
  } else {
    log.error("RolesModifier {} already exists", [rolesModifierId])
    return
  }
}

export function handleSetDefaultRole(event: SetDefaultRole): void {
  const rolesModifierAddress = event.address
  const rolesModifierId = getRolesModifierId(rolesModifierAddress)
  const rolesModifier = getRolesModifier(rolesModifierId)
  if (!rolesModifier) {
    return
  }

  const memberAddress = event.params.module
  const memberId = getMemberId(rolesModifierId, memberAddress)
  const member = getOrCreateMember(memberId, rolesModifierId, memberAddress) // create member if it does not exist yet

  const roleKey = event.params.defaultRoleKey
  const roleId = getRoleId(rolesModifierId, roleKey)
  // create role if it does not exist yet
  getOrCreateRole(roleId, rolesModifierId, roleKey)

  member.defaultRole = roleId
  member.save()
}

export function handleAvatarSet(event: AvatarSet): void {
  const rolesModifierAddress = event.address
  const rolesModifierId = getRolesModifierId(rolesModifierAddress)
  const rolesModifier = getRolesModifier(rolesModifierId)
  if (!rolesModifier) {
    return
  }

  rolesModifier.avatar = event.params.newAvatar
  rolesModifier.save()
}

export function handleTargetSet(event: TargetSet): void {
  const rolesModifierAddress = event.address
  const rolesModifierId = getRolesModifierId(rolesModifierAddress)
  const rolesModifier = getRolesModifier(rolesModifierId)
  if (!rolesModifier) {
    return
  }

  rolesModifier.target = event.params.newTarget
  rolesModifier.save()
}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {
  const rolesModifierAddress = event.address
  const rolesModifierId = getRolesModifierId(rolesModifierAddress)
  const rolesModifier = getRolesModifier(rolesModifierId)
  if (!rolesModifier) {
    return
  }

  rolesModifier.owner = event.params.newOwner
  rolesModifier.save()
}
