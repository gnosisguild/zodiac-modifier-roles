import { BigNumber } from "ethers"
import {
  BytesLike,
  concat,
  getCreate2Address,
  hexDataLength,
  hexlify,
  keccak256,
} from "ethers/lib/utils"

import { Condition, Operator } from "../types"

import { flattenCondition } from "./flattenCondition"
import { ConditionFlat } from "./types"

const ERC2470_SINGLETON_FACTORY_ADDRESS =
  "0xce0042b868300000d44a59004da54a005ffdcf9f"
const CREATE2_SALT = "0x00"

export const getConditionId = (condition: Condition) => {
  const conditions = flattenCondition(condition)
  const packed = conditions
    .map((condition) => packCondition(condition))
    .reduce((acc, item) => acc.concat(item), new Bytes(0))
    .concat(
      conditions
        .map((condition) => packCompValue(condition))
        .reduce((acc, item) => acc.concat(item), new Bytes(0))
    )

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

const packCompValue = (condition: ConditionFlat) =>
  condition.operator == Operator.EqualTo
    ? keccak256(condition.compValue)
    : bytes32(condition.compValue)

const initCodeFor = (bytecode: BytesLike) =>
  concat([
    "0x63",
    BigNumber.from(hexDataLength(bytecode) + 1).toHexString(),
    "0x80600E6000396000F300",
    bytecode,
  ])
