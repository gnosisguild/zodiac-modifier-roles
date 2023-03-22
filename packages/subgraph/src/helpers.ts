import { Address, BigInt, Bytes, log } from "@graphprotocol/graph-ts"
import { Function, Role, RolesModifier, Target, Condition, Member, Allowance, UnwrapAdapter } from "../generated/schema"
import { Clearance, ExecutionOptions, Operator } from "./enums"

export const getRolesModifierId = (rolesModifier: Address): string => rolesModifier.toHex()
export const getRoleId = (roleModifierId: string, roleKey: string): string => roleModifierId + "-ROLE-" + roleKey
export const getTargetId = (roleId: string, target: Address): string => roleId + "-TARGET-" + target.toHex()
export const getMemberId = (rolesModifierId: string, member: Address): string =>
  rolesModifierId + "-MEMBER-" + member.toHex()
export const getFunctionId = (targetId: string, selector: Bytes): string => targetId + "-FUNCTION-" + selector.toHex()
export const getAssignmentId = (memberId: string, roleId: string): string => memberId + "-" + roleId
export const getAllowanceId = (allowanceKey: string, rolesModifierId: string): string =>
  rolesModifierId + "-ALLOWANCE-" + allowanceKey
export const getUnwrapAdapterId = (targetAddress: Address, selector: Bytes, rolesModifierId: string): string =>
  rolesModifierId + "-ADAPTER-" + targetAddress.toHex() + "." + selector.toHex()

export const getOrCreateRole = (roleId: string, rolesModifierId: string, key: string): Role => {
  let role = Role.load(roleId)

  // save role if this is the first time we encounter it
  if (!role) {
    role = new Role(roleId)
    role.key = key
    role.rolesModifier = rolesModifierId
    role.save()
    log.info("Created new role #{}", [roleId])
  } else {
    log.debug("Loaded existing role #{}", [roleId])
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
    log.info("Created new target #{}", [targetId])
  } else {
    log.debug("Loaded existing target #{}", [targetId])
  }
  return target
}

/**
 * For created Functions:
 *  - executionOptions is None
 *  - wildcarded is false
 */
export const getOrCreateFunction = (functionId: string, targetId: string, selector: Bytes): Function => {
  let func = Function.load(functionId)

  if (!func) {
    func = new Function(functionId)
    func.target = targetId
    func.selector = selector
    func.executionOptions = ExecutionOptions[ExecutionOptions.None]
    func.wildcarded = false
    func.save()
    log.info("Created new function #{}", [functionId])
  } else {
    log.debug("Loaded existing function #{}", [functionId])
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
    log.info("Created new condition #{}", [conditionId])
  } else {
    log.debug("Loaded existing condition #{}", [conditionId])
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
    log.warning("RolesModifier {} does not exist", [rolesModifierId])
    return null
  }
  return rolesModifier
}

/**
 * For created Allowance:
 *  - balance is 0
 *  - maxBalance is 0
 *  - refillAmount is 0
 *  - refillInterval is 0
 *  - refillTimestamp is 0
 */
export const getOrCreateAllowance = (allowanceKey: string, rolesModifierId: string): Allowance => {
  const id = getAllowanceId(allowanceKey, rolesModifierId)
  let allowance = Allowance.load(id)
  if (!allowance) {
    allowance = new Allowance(id)
    allowance.key = allowanceKey
    allowance.rolesModifier = rolesModifierId
    allowance.balance = BigInt.fromU32(0)
    allowance.maxBalance = BigInt.fromU32(0)
    allowance.refillAmount = BigInt.fromU32(0)
    allowance.refillInterval = 0
    allowance.refillTimestamp = 0
    allowance.save()
  }
  return allowance
}

export const getOrCreateUnwrapAdapter = (
  targetAddress: Address,
  selector: Bytes,
  rolesModifierId: string,
): UnwrapAdapter => {
  const id = getUnwrapAdapterId(targetAddress, selector, rolesModifierId)
  let adapter = UnwrapAdapter.load(id)

  // save adapter the first time we encounter it
  if (!adapter) {
    adapter = new UnwrapAdapter(id)
    adapter.rolesModifier = rolesModifierId
    adapter.targetAddress = targetAddress
    adapter.selector = selector
    adapter.save()
    log.info("Created new UnwrapAdapter #{}", [id])
  } else {
    log.debug("Loaded existing UnwrapAdapter #{}", [id])
  }

  return adapter
}
