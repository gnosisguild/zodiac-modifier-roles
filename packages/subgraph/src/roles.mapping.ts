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
  getOrCreateMember,
  getOrCreateRole,
  getRoleId,
  getRolesModifierId,
  getTargetId,
} from "./helpers"

export function handleAssignRoles(event: AssignRoles): void {
  // add and remove member from roles
  const rolesModifierAddress = event.address
  const rolesModifierId = getRolesModifierId(rolesModifierAddress)

  let rolesModifier = RolesModifier.load(rolesModifierId)
  if (!rolesModifier) {
    log.info("This event is not for any of our rolesModifiers. A roles modifier with that address does not exist", [
      rolesModifierId,
    ])
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
    const memberRoleId = getMemberRoleId(memberId, roleId)
    let memberRole = MemberRole.load(memberRoleId)
    if (!memberRole) {
      if (memberOfArray[i]) {
        // adding a member
        memberRole = new MemberRole(memberRoleId)
        memberRole.member = memberId
        memberRole.role = roleId
        memberRole.save()
      } else {
        // nothing to do the member - role relationship does not exist
        log.info("trying to remove a member from a role it is not a member of", [memberId, roleId])
      }
    } else {
      if (memberOfArray[i]) {
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

export function handleDisabledModule(event: DisabledModule): void {
  // TODO: must set member as disabled
}

export function handleEnabledModule(event: EnabledModule): void {
  // TODO: must create member
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
