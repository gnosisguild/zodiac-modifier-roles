import { Address, BigInt, Bytes, log } from "@graphprotocol/graph-ts"
import {
  Function,
  Role,
  RolesModifier,
  Target,
  Member,
  Allowance,
  UnwrapAdapter,
  Annotation,
} from "../generated/schema"
import { Clearance, ClearanceKeys, ExecutionOptions, ExecutionOptionsKeys } from "./enums"

export const getRolesModifierId = (rolesModifier: Address): string => rolesModifier.toHex()
export const getRoleId = (roleModifierId: string, roleKey: Bytes): string => roleModifierId + "-ROLE-" + roleKey.toHex()
export const getTargetId = (roleId: string, target: Address): string => roleId + "-TARGET-" + target.toHex()
export const getMemberId = (rolesModifierId: string, member: Address): string =>
  rolesModifierId + "-MEMBER-" + member.toHex()
export const getFunctionId = (targetId: string, selector: Bytes): string => targetId + "-FUNCTION-" + selector.toHex()
export const getAssignmentId = (memberId: string, roleId: string): string => memberId + "-" + roleId
export const getAllowanceId = (allowanceKey: Bytes, rolesModifierId: string): string =>
  rolesModifierId + "-ALLOWANCE-" + allowanceKey.toHex()
export const getUnwrapAdapterId = (targetAddress: Address, selector: Bytes, rolesModifierId: string): string =>
  rolesModifierId + "-ADAPTER-" + targetAddress.toHex() + "." + selector.toHex()
export const getAnnotationId = (uri: string, rolesModifierId: string): string => rolesModifierId + "-ANNOTATION-" + uri

export const getOrCreateRole = (roleId: string, rolesModifierId: string, key: Bytes, blockNumber: BigInt): Role => {
  let role = Role.load(roleId)

  // save role if this is the first time we encounter it
  if (!role) {
    role = new Role(roleId)
    role.key = key
    role.rolesModifier = rolesModifierId
    role.lastUpdate = blockNumber
    role.save()
    log.info("Created new role #{}", [roleId])
  } else {
    log.debug("Loaded existing role #{}", [roleId])
    // already now set the last update block number, so we don't have to remember to do it before saving
    role.lastUpdate = blockNumber
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
    target.executionOptions = ExecutionOptionsKeys[ExecutionOptions.None]
    target.clearance = ClearanceKeys[Clearance.None]
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
    func.executionOptions = ExecutionOptionsKeys[ExecutionOptions.None]
    func.wildcarded = false
    func.save()
    log.info("Created new function #{}", [functionId])
  } else {
    log.debug("Loaded existing function #{}", [functionId])
  }

  return func
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
    log.info("{} is not a Roles modifier", [rolesModifierId])
    return null
  }
  return rolesModifier
}

/**
 * For created Allowance:
 *  - balance is 0
 *  - maxRefill is 0
 *  - refill is 0
 *  - period is 0
 *  - timestamp is 0
 */
export const getOrCreateAllowance = (allowanceKey: Bytes, rolesModifierId: string): Allowance => {
  const id = getAllowanceId(allowanceKey, rolesModifierId)
  let allowance = Allowance.load(id)
  if (!allowance) {
    allowance = new Allowance(id)
    allowance.key = allowanceKey
    allowance.rolesModifier = rolesModifierId
    allowance.balance = BigInt.fromU32(0)
    allowance.maxRefill = BigInt.fromU32(0)
    allowance.refill = BigInt.fromU32(0)
    allowance.period = BigInt.fromU32(0)
    allowance.timestamp = BigInt.fromU32(0)
    allowance.save()
  }
  return allowance
}

export const ADDRESS_ZERO = Address.fromHexString("0x0000000000000000000000000000000000000000")

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
    adapter.adapterAddress = ADDRESS_ZERO
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

export const getOrCreateAnnotation = (uri: string, schema: string, roleId: string): Annotation => {
  const id = getAnnotationId(uri, roleId)
  let annotation = Annotation.load(id)

  // save annotation the first time we encounter it
  if (!annotation) {
    annotation = new Annotation(id)
    annotation.role = roleId
    annotation.uri = uri
    annotation.schema = schema
    annotation.save()
    log.info("Created new Annotation #{}", [id])
  } else {
    log.debug("Loaded existing Annotation #{}", [id])
  }

  return annotation
}
