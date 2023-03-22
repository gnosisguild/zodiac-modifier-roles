import { Address, Bytes, log } from "@graphprotocol/graph-ts"
import { Function, Role, RolesModifier, Target, Condition, Member } from "../generated/schema"
import { Clearance, ExecutionOptions, Operator } from "./enums"

export const getRolesModifierId = (rolesModifier: Address): string => rolesModifier.toHex()
export const getRoleId = (roleModifierId: string, roleKey: string): string => roleModifierId + "-ROLE-" + roleKey
export const getTargetId = (roleId: string, target: Address): string => roleId + "-TARGET-" + target.toHex()
export const getMemberId = (rolesModifierId: string, member: Address): string =>
  rolesModifierId + "-MEMBER-" + member.toHex()
export const getFunctionId = (targetId: string, sighash: Bytes): string => targetId + "-FUNCTION-" + sighash.toHex()
export const getAssignmentId = (memberId: string, roleId: string): string => memberId + "-" + roleId

export const getOrCreateRole = (roleId: string, rolesModifierId: string, key: string): Role => {
  let role = Role.load(roleId)

  // save role if this is the first time we encounter it
  if (!role) {
    role = new Role(roleId)
    role.key = key
    role.rolesModifier = rolesModifierId
    role.save()
    log.info("Created new role", [roleId])
  } else {
    log.debug("Loaded existing role", [roleId])
  }
  return role
}

/**
 * For created Targets:
 *  - executionOptions is None.
 *  - clearance is None.
 */
export const getOrCreateTarget = (targetId: string, targetAddress: Address, roleId: string): Target => {
  let target = Target.load(targetId)

  if (!target) {
    target = new Target(targetId)
    target.address = targetAddress
    target.role = roleId
    target.executionOptions = ExecutionOptions[ExecutionOptions.None]
    target.clearance = Clearance[Clearance.None]
    target.save()
    log.info("Created new target", [targetId])
  } else {
    log.debug("Loaded existing target", [targetId])
  }
  return target
}

/**
 * For created Functions:
 *  - executionOptions is None
 *  - wildcarded is false
 */
export const getOrCreateFunction = (functionId: string, targetId: string, sighash: Bytes): Function => {
  let func = Function.load(functionId)

  if (!func) {
    func = new Function(functionId)
    func.target = targetId
    func.sighash = sighash
    func.executionOptions = ExecutionOptions[ExecutionOptions.None]
    func.wildcarded = false
    func.save()
    log.info("Created new function", [functionId])
  } else {
    log.debug("Loaded existing function", [functionId])
  }

  return func
}

/**
 * For created Conditions:
 *  - operator is Pass
 */
export const getOrCreateCondition = (conditionId: string): Condition => {
  let condition = Condition.load(conditionId)

  if (!condition) {
    condition = new Condition(conditionId)
    condition.operator = Operator[Operator.Pass]
    condition.save()
    log.info("Created new condition", [conditionId])
  } else {
    log.debug("Loaded existing condition", [conditionId])
  }
  return condition
}

/**
 * For created Member:
 *  - enabledAsModule is false
 */
export const getOrCreateMember = (memberId: string, rolesModifierId: string, memberAddress: Address): Member => {
  let member = Member.load(memberId)
  if (!member) {
    member = new Member(memberId)
    member.address = memberAddress
    member.enabledAsModule = false
    member.save()
  }
  return member
}

export const getRolesModifier = (rolesModifierId: string): RolesModifier | null => {
  let rolesModifier = RolesModifier.load(rolesModifierId)
  if (!rolesModifier) {
    log.info("This event is not for any of our rolesModifiers. A roles modifier with that address does not exist", [
      rolesModifierId,
    ])
    return null
  }
  return rolesModifier
}
