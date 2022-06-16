import { Address, Bytes, log, store } from "@graphprotocol/graph-ts"
import { Function, Role, RolesModifier, Target, Parameter, Member } from "../generated/schema"
export const EXECUTION_OPTIONS = ["None", "Send", "DelegateCall", "Both"]
export const EXECUTION_OPTIONS__NONE = 0
export const EXECUTION_OPTIONS__SEND = 1
export const EXECUTION_OPTIONS__DELEGATE_CALL = 2
export const execution_options__both = 3

export const CLEARANCE = ["None", "Target", "Function"]
export const CLEARANCE__NONE = 0
export const CLEARANCE__TARGET = 1
export const CLEARANCE__FUNCTION = 2

export const PARAMETER_TYPE = ["Static", "Dynamic", "Dynamic32"]
export const PARAMETER_TYPE__STATIC = 0
export const PARAMETER_TYPE__DYNAMIC = 1
export const PARAMETER_TYPE__DYNAMIC32 = 2

export const PARAMETER_COMPARISON = ["EqualTo", "GreaterThan", "LessThan", "OneOf"]
export const PARAMETER_COMPARISON__EQUAL_TO = 0
export const PARAMETER_COMPARISON__GREATER_THAN = 1
export const PARAMETER_COMPARISON__LESS_THAN = 2
export const PARAMETER_COMPARISON__ONE_OF = 3

export const getRolesModifierId = (rolesModifier: Address): string => rolesModifier.toHex()
export const getRoleId = (roleModifierId: string, role: number): string => roleModifierId + "-ROLE-" + role.toString()
export const getTargetId = (roleId: string, target: Address): string => roleId + "-TARGET-" + target.toHex()
export const getMemberId = (rolesModifierId: string, member: Address): string =>
  rolesModifierId + "-MEMBER-" + member.toHex()
export const getFunctionId = (targetId: string, sighash: Bytes): string => targetId + "-FUNCTION-" + sighash.toHex()
export const getAssignmentId = (memberId: string, roleId: string): string => memberId + "-" + roleId
export const getParameterId = (functionId: string, parameterIndex: number): string =>
  functionId + "-PARAMETER-" + parameterIndex.toString()

export const getOrCreateRole = (roleId: string, rolesModifierId: string, roleIdInContract: i32): Role => {
  let role = Role.load(roleId)

  // save role if this is the first time we encounter it
  if (!role) {
    role = new Role(roleId)
    role.name = roleIdInContract.toString()
    role.roleIdInContract = roleIdInContract
    role.rolesModifier = rolesModifierId
    role.save()
    log.info("Created new role", [roleId])
  } else {
    log.debug("Loaded existing role", [roleId])
  }
  return role
}

/*
For created Targets:
 - execution options is None.
 - clearance is None.
*/
export const getOrCreateTarget = (targetId: string, targetAddress: Address, roleId: string): Target => {
  let target = Target.load(targetId)

  if (!target) {
    target = new Target(targetId)
    target.address = targetAddress
    target.role = roleId
    target.executionOptions = EXECUTION_OPTIONS[EXECUTION_OPTIONS__NONE]
    target.clearance = CLEARANCE[CLEARANCE__NONE]
    target.save()
    log.info("Created new target", [targetId])
  } else {
    log.debug("Loaded existing target", [targetId])
  }
  return target
}

/*
For created Functions:
 - execution options options is None.
 - wildcarded is false.
*/
export const getOrCreateFunction = (functionId: string, targetId: string, sighash: Bytes): Function => {
  let theFunction = Function.load(functionId)

  if (!theFunction) {
    theFunction = new Function(functionId)
    theFunction.target = targetId
    theFunction.sighash = sighash
    theFunction.executionOptions = EXECUTION_OPTIONS[EXECUTION_OPTIONS__NONE]
    theFunction.wildcarded = false
    theFunction.save()
    log.info("Created new function", [functionId])
  } else {
    log.debug("Loaded existing function", [functionId])
  }
  return theFunction
}
/*
Fore created Member:
 - enabledAsModule is false
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
