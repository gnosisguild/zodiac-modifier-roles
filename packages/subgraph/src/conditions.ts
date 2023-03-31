import { Address, ByteArray, Bytes, crypto } from "@graphprotocol/graph-ts"
import { ScopeFunctionConditionsStruct } from "../generated/PermissionBuilder/PermissionBuilder"
import { Condition } from "../generated/schema"
import { Operator, OperatorKeys, ParameterType, ParameterTypeKeys } from "./enums"

export const storeConditions = (conditions: ScopeFunctionConditionsStruct[]): Condition => {
  assert(conditions.length > 0, "Conditions array is empty")

  const rootId = getRootConditionId(conditions)
  let rootCondition = Condition.load(rootId)
  if (rootCondition) {
    // condition is already stored, we can just use it
    return rootCondition
  }

  for (let i = 0; i < conditions.length; i++) {
    const id = i == 0 ? rootId : rootId + "-" + i.toString()
    const parentId: string | null = i == 0 ? null : rootId + "-" + (conditions[i].parent - 1).toString()
    assert(i == 0 || parentId != "", "Parent missing")

    const condition = new Condition(id)
    condition.index = i
    condition.parent = parentId
    condition.operator = OperatorKeys[conditions[i].operator]
    condition.paramType = ParameterTypeKeys[conditions[i].paramType]
    condition.compValue = conditions[i].compValue
    condition.save()

    if (i == 0) {
      rootCondition = condition
    }
  }

  if (!rootCondition) {
    throw new Error("Root condition is null")
  }

  return rootCondition
}

export const ERC2470_SINGLETON_FACTORY_ADDRESS = Address.fromString("0xce0042b868300000d44a59004da54a005ffdcf9f")
export const CREATE2_SALT = Bytes.fromUint8Array(new Uint8Array(32).fill(0))

export function getRootConditionId(conditions: ScopeFunctionConditionsStruct[]): string {
  const packed = conditions
    .map<Bytes>((condition) => packCondition(condition))
    .reduce((acc, item) => acc.concat(item), new Bytes(0))
    .concat(
      conditions
        .map<Bytes>((condition) => packCompValue(condition))
        .reduce((acc, item) => acc.concat(item), new Bytes(0)),
    )

  const initCode = creationCodeFor(packed)
  return generateAddress2(ERC2470_SINGLETON_FACTORY_ADDRESS, CREATE2_SALT, initCode).toHexString()
}

// 8    bits -> parent
// 3    bits -> param type
// 5    bits -> operator
const offsetParent = 8
const offsetParamType = 5
const offsetOperator = 0

function packCondition(condition: ScopeFunctionConditionsStruct): Bytes {
  return Bytes.fromI32(
    (condition.parent << offsetParent) |
      (condition.paramType << offsetParamType) |
      (condition.operator << offsetOperator),
  )
}

function packCompValue(condition: ScopeFunctionConditionsStruct): Bytes {
  return condition.operator == Operator.EqualTo
    ? Bytes.fromByteArray(crypto.keccak256(condition.compValue))
    : bytes32(condition.compValue)
}

function bytes32(value: Bytes): Bytes {
  return Bytes.fromUint8Array(value.slice(0, 32))
}

function creationCodeFor(bytecode: Bytes): Bytes {
  return Bytes.fromHexString("0x63")
    .concat(Bytes.fromI32(bytecode.length + 1))
    .concat(Bytes.fromHexString("0x80600E6000396000F300"))
    .concat(bytecode)
}

/**
 * Generates an address for a contract created using CREATE2.
 * Adapted from https://github.com/ethereumjs/ethereumjs-util/blob/master/src/account.ts#L201
 * @param from The address which is creating this new address
 * @param salt A salt
 * @param initCode The init code of the contract being created
 */
export function generateAddress2(from: Address, salt: Bytes, initCode: Bytes): Address {
  assert(salt.length == 32)
  return Address.fromBytes(
    Bytes.fromUint8Array(
      crypto
        .keccak256(
          Bytes.fromHexString("0xff")
            .concat(from)
            .concat(salt)
            .concat(Bytes.fromByteArray(crypto.keccak256(initCode))),
        )
        .slice(-20),
    ),
  )
}
