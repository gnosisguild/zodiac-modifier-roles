import { Address, Bytes, crypto, log } from "@graphprotocol/graph-ts"
import { JSONEncoder } from "assemblyscript-json"

import { ScopeFunctionConditionsStruct } from "../generated/PermissionBuilder/PermissionBuilder"
import { Condition } from "../generated/schema"
import { Operator, ParameterType } from "./enums"

export const storeConditions = (conditions: ScopeFunctionConditionsStruct[]): Condition => {
  assert(conditions.length > 0, "Conditions array is empty")

  const id = getConditionId(conditions)
  const existingCondition = Condition.load(id)
  if (existingCondition) {
    // condition is already stored, we can just use it
    return existingCondition
  }

  const newCondition = new Condition(id)

  const tree = conditions.length > 0 ? toTree(conditions) : null
  if (tree) {
    const encoder = new JSONEncoder()
    jsonStringify(tree, encoder)
    newCondition.json = encoder.toString()
  }

  newCondition.save()
  return newCondition
}

class ConditionTree {
  // children: ConditionTree[] = []
  constructor(
    public paramType: ParameterType,
    public operator: Operator,
    public compValue: string,
    public children: ConditionTree[],
  ) {}
}

function toTree(flatConditions: ScopeFunctionConditionsStruct[]): ConditionTree | null {
  const conditions: ConditionTree[] = []

  for (let i = 0; i < flatConditions.length; i++) {
    const flatCondition = flatConditions[i]
    const condition = new ConditionTree(
      flatCondition.paramType,
      flatCondition.operator,
      flatCondition.compValue.toHexString(),
      [],
    )
    conditions.push(condition)

    if (flatCondition.parent != i) {
      if (flatCondition.parent >= conditions.length) {
        log.error("conditions flat list is not ordered breadth-first, violation at index {} referencing parent {}", [
          i.toString(),
          flatCondition.parent.toString(),
        ])
        return null
      }
      conditions[flatCondition.parent].children.push(condition)
    }
  }

  return conditions[0]
}

function jsonStringify(tree: ConditionTree, encoder: JSONEncoder): void {
  encoder.pushObject(null)
  encoder.setInteger("operator", tree.operator)
  encoder.setInteger("paramType", tree.paramType)
  if (tree.compValue != "0x") {
    encoder.setString("compValue", tree.compValue)
  }
  if (tree.children.length > 0) {
    encoder.pushArray("children")
    for (let i = 0; i < tree.children.length; i++) {
      jsonStringify(tree.children[i], encoder)
    }
    encoder.popArray()
  }
  encoder.popObject()
}

export const ERC2470_SINGLETON_FACTORY_ADDRESS = Address.fromString("0xce0042b868300000d44a59004da54a005ffdcf9f")
export const ZERO_SALT = Bytes.fromUint8Array(new Uint8Array(32).fill(0))

export function getConditionId(conditions: ScopeFunctionConditionsStruct[]): string {
  const packed = conditions
    .map<string>((condition) => packCondition(condition))
    .reduce((acc, item) => acc + item.slice(2), "0x")

  const initCode = creationCodeFor(Bytes.fromHexString(packed).concat(packCompValues(conditions)))
  return generateAddress2(ERC2470_SINGLETON_FACTORY_ADDRESS, ZERO_SALT, initCode).toHexString()
}

// 8    bits -> parent
// 3    bits -> param type
// 5    bits -> operator
const offsetParent = 8
const offsetParamType = 5
const offsetOperator = 0

function packCondition(condition: ScopeFunctionConditionsStruct): string {
  const bytes = new Uint8Array(2)
  bytes[0] = u8(condition.parent) << u8(offsetParent)
  bytes[1] = (u8(condition.paramType) << u8(offsetParamType)) | (u8(condition.operator) << u8(offsetOperator))
  return Bytes.fromUint8Array(bytes).toHexString()
}

function packCompValues(conditions: ScopeFunctionConditionsStruct[]): Bytes {
  let result = new Bytes(0)

  for (let i = 0; i < conditions.length; i++) {
    const condition = conditions[i]
    if (!hasCompValue(condition.operator)) {
      continue
    }

    const compValue = compValueWithoutExtraneousOffset(conditions, i)
    result = result.concat(
      condition.operator == Operator.EqualTo ? Bytes.fromByteArray(crypto.keccak256(compValue)) : bytes32(compValue),
    )
  }

  return result
}

function bytes32(value: Bytes): Bytes {
  return Bytes.fromUint8Array(value.slice(0, 32))
}

function hasCompValue(operator: Operator): boolean {
  return operator >= Operator.EqualTo
}

function creationCodeFor(bytecode: Bytes): Bytes {
  const lengthHex = "0x" + (bytecode.length + 1).toString(16).padStart(8, "0")
  return Bytes.fromHexString("0x63")
    .concat(Bytes.fromHexString(lengthHex))
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

function compValueWithoutExtraneousOffset(conditions: ScopeFunctionConditionsStruct[], index: i32): Bytes {
  if (conditions[index].compValue && conditions[index].operator == Operator.EqualTo && !isInline(conditions, index)) {
    return Bytes.fromUint8Array(conditions[index].compValue.slice(32)) //Bytes.fromHexString("0x" + conditions[index].compValue.toHexString().slice(66))
  }
  return conditions[index].compValue
}

function isInline(conditions: ScopeFunctionConditionsStruct[], index: i32): boolean {
  const paramType = conditions[index].paramType
  switch (paramType) {
    case ParameterType.Static:
      return true
    case ParameterType.Tuple:
      for (let j = index + 1; j < conditions.length; ++j) {
        const parent = conditions[j].parent
        if (parent < index) continue
        if (parent > index) break
        if (!isInline(conditions, j)) {
          return false
        }
      }
      return true
    default:
      return false
  }
}
