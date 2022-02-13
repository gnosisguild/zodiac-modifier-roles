import { Address, Bytes, log, store } from "@graphprotocol/graph-ts"
import { RolesModifier } from "../generated/schema"
export const EXECUTION_OPTIONS = ["None", "Send", "DelegateCall", "Both"]
export const EXECUTION_OPTIONS__NONE = 0
export const EXECUTION_OPTIONS__SEND = 1
export const EXECUTION_OPTIONS__DELEGATE_CALL = 2
export const execution_options__both = 3

export const CLEARANCE = ["None", "Target", "Function"]
export const CLEARANCE__NONE = 0
export const CLEARANCE__TARGET = 1
export const CLEARANCE__FUNCTION = 2

export const getRolesModifierId = (rolesModifier: Address): string => rolesModifier.toHexString()
export const getRoleId = (roleModifierId: string, role: number): string => roleModifierId + "-" + role.toString()
export const getTargetId = (roleId: string, target: Address): string => roleId + "-TARGET-" + target.toHex()
export const getMemberId = (roleId: string, member: Address): string => roleId + "-MEMBER-" + member.toHex()

export const getFunctionId = (targetId: string, functionSig: Bytes): string =>
  targetId + "-FUNCTION-" + functionSig.toHex()

export const getMemberRoleId = (memberId: string, roleId: string): string => memberId + "-" + roleId
