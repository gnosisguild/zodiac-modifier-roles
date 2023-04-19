import { BigNumber } from "ethers"
import {
  BytesLike,
  concat,
  defaultAbiCoder,
  getCreate2Address,
  hexDataLength,
  hexlify,
  hexConcat,
  keccak256,
} from "ethers/lib/utils"

import { Condition, Operator } from "../types"

import { flattenCondition } from "./flattenCondition"
import { ConditionFlat } from "./types"

const ERC2470_SINGLETON_FACTORY_ADDRESS =
  "0xce0042b868300000d44a59004da54a005ffdcf9f"
const CREATE2_SALT =
  "0xbadfed0000000000000000000000000000000000000000000000000000badfed"

export const getConditionId = (condition: Condition) => {
  const conditions = flattenCondition(condition)
  const packed = hexConcat([
    ...conditions.map((condition) => packCondition(condition)),
    ...conditions.map((condition) => packCompValue(condition)),
  ])

  const initCode = initCodeFor(packed)
  return getCreate2Address(
    ERC2470_SINGLETON_FACTORY_ADDRESS,
    CREATE2_SALT,
    keccak256(initCode)
  )
}

// 8    bits -> parent
// 3    bits -> param type
// 5    bits -> operator
const offsetParent = 8
const offsetParamType = 5
const offsetOperator = 0

const packCondition = (condition: ConditionFlat) =>
  hexlify(
    (condition.parent << offsetParent) |
      (condition.paramType << offsetParamType) |
      (condition.operator << offsetOperator)
  )

const packCompValue = (condition: ConditionFlat) => {
  if (!hasCompValue(condition.operator)) return "0x"
  if (!condition.compValue) {
    throw new Error(
      `compValue is required for operator ${Operator[condition.operator]}`
    )
  }

  return condition.operator == Operator.EqualTo
    ? keccak256(condition.compValue)
    : defaultAbiCoder.encode(["bytes32"], [condition.compValue])
}

const initCodeFor = (bytecode: BytesLike) =>
  concat([
    "0x63",
    BigNumber.from(hexDataLength(bytecode) + 1).toHexString(),
    "0x80600E6000396000F300",
    bytecode,
  ])

const hasCompValue = (operator: Operator) => operator >= Operator.EqualTo
