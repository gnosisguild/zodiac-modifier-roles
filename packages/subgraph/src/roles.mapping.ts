import {
  AssignRoles,
  AvatarSet,
  ChangedGuard,
  DisabledModule,
  EnabledModule,
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
} from "./helpers"

export function handleAssignRoles(event: AssignRoles): void {
  // add and remove member from roles
  const rolesModifierAddress = event.address
  const rolesModifierId = getRolesModifierId(rolesModifierAddress)

  let rolesModifier = RolesModifier.load(rolesModifierId)
  if (!rolesModifier) {
    log.warning("RolesModifier {} does not exist", [rolesModifierId])
    return
  }

  const memberAddress = event.params.module
  const memberId = getMemberId(rolesModifierId, memberAddress)
  const member = getOrCreateMember(memberId, rolesModifierId, memberAddress)

  const rolesArray = event.params.roles
  const memberOfArray = event.params.memberOf

  for (let i = 0; i < rolesArray.length; i++) {
    const roleId = getRoleId(rolesModifierId, rolesArray[i])
    const role = getOrCreateRole(roleId, rolesModifierId, rolesArray[i])
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

export function handleAvatarSet(event: AvatarSet): void {}

export function handleChangedGuard(event: ChangedGuard): void {}

export function handleDisabledModule(event: DisabledModule): void {
  const rolesModifierAddress = event.address
  const rolesModifierId = getRolesModifierId(rolesModifierAddress)

  let rolesModifier = RolesModifier.load(rolesModifierId)
  if (!rolesModifier) {
    log.error("RolesModifier {} does not exist", [rolesModifierId])
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

  let rolesModifier = RolesModifier.load(rolesModifierId)
  if (!rolesModifier) {
    log.error("RolesModifier {} does not exist", [rolesModifierId])
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

export function handleSetDefaultRole(event: SetDefaultRole): void {}

export function handleTargetSet(event: TargetSet): void {}
