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
import { RolesModifier, Role, Member, MemberRole } from "../generated/schema"
import { log, store } from "@graphprotocol/graph-ts"
import {
  CLEARANCE,
  CLEARANCE__FUNCTION,
  CLEARANCE__NONE,
  CLEARANCE__TARGET,
  EXECUTION_OPTIONS,
  EXECUTION_OPTIONS__NONE,
  getFunctionId,
  getMemberId,
  getMemberRoleId,
  getRoleId,
  getRolesModifierId,
  getTargetId,
} from "./helpers"

export function handleAssignRoles(event: AssignRoles): void {
  // add and remove member from roles
  const rolesModifierAddress = event.address
  const rolesModifierId = getRolesModifierId(rolesModifierAddress)
  const rolesModifier = RolesModifier.load(rolesModifierId) // must this be loaded?

  if (!rolesModifier) {
    log.error("a uninitialized rolesModifier is assigning roles", [rolesModifierAddress.toString()])
    return
  }

  const memberAddress = event.params.module
  const roles = event.params.roles
  const memberOf = event.params.memberOf

  for (let i = 0; i < roles.length; i++) {
    const roleId = getRoleId(rolesModifierId, roles[i])
    const memberId = getMemberId(roleId, memberAddress)
    const memberRoleId = getMemberRoleId(memberId, roleId)
    let memberRole = MemberRole.load(memberRoleId)
    if (!memberRole) {
      if (memberOf[i]) {
        // adding a member
        let role = Role.load(roleId)
        if (!role) {
          role = new Role(roleId)
          role.rolesModifier = rolesModifierId
          role.save()
        }
        let member = Member.load(memberId)
        if (!member) {
          member = new Member(memberId)
          member.address = memberAddress
          member.save()
        }
        memberRole = new MemberRole(memberRoleId)
        memberRole.member = memberId
        memberRole.role = roleId
        memberRole.save()
      } else {
        // nothing to do the member - role relationship does not exist
        log.info("trying to remove a member from a role it is not a member of", [memberId, roleId])
      }
    } else {
      if (memberOf[i]) {
        // adding a member that is already a member
        log.info("trying to add a member to a role it is already a member of", [memberId, roleId])
      } else {
        // removing a member-role relationship
        store.remove("MemberRole", memberRoleId)
      }
    }
  }
}

export function handleAvatarSet(event: AvatarSet): void {}

export function handleChangedGuard(event: ChangedGuard): void {}

export function handleDisabledModule(event: DisabledModule): void {}

export function handleEnabledModule(event: EnabledModule): void {}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {}

export function handleRolesModSetup(event: RolesModSetup): void {
  const rolesModifierAddress = event.address
  let rolesModifierId = rolesModifierAddress.toHexString()
  let rolesModifier = RolesModifier.load(rolesModifierId)

  if (!rolesModifier) {
    rolesModifier = new RolesModifier(rolesModifierId)
    rolesModifier.address = rolesModifierAddress
    rolesModifier.owner = event.params.owner
    rolesModifier.avatar = event.params.avatar
    rolesModifier.exec_target = event.params.target
    rolesModifier.save()
  } else {
    log.error("RolesModifier already exists", [rolesModifierId])
    return
  }
}

export function handleSetDefaultRole(event: SetDefaultRole): void {}

export function handleSetMultisendAddress(event: SetMultisendAddress): void {}

export function handleTargetSet(event: TargetSet): void {}
