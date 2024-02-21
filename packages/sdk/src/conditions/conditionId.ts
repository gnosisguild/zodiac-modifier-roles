import { BigNumber } from "ethers"
import {
  BytesLike,
  concat,
  getCreate2Address,
  hexDataLength,
  hexlify,
  hexConcat,
  keccak256,
  hexZeroPad,
} from "ethers/lib/utils"

import { Condition, Operator, ParameterType } from "../types"
import { encodeAbiParameters } from "../utils/encodeAbiParameters"

import { flattenCondition } from "./flattenCondition"
import { ConditionFlat } from "./types"

const ERC2470_SINGLETON_FACTORY_ADDRESS =
  "0xce0042b868300000d44a59004da54a005ffdcf9f"
const ZERO_SALT =
  "0x0000000000000000000000000000000000000000000000000000000000000000"

/**
 * Calculates the create2 storage address of the condition.
 */
export const conditionId = (condition: Condition) => {
  const conditions = flattenCondition(condition)
  removeExtraneousOffsets(conditions)

  const packed = hexConcat([
    ...conditions.map((condition) => packCondition(condition)),
    ...conditions.map((condition) => packCompValue(condition)),
  ])

  const initCode = initCodeFor(packed)

  return getCreate2Address(
    ERC2470_SINGLETON_FACTORY_ADDRESS,
    ZERO_SALT,
    keccak256(initCode)
  ).toLowerCase()
}

// 8    bits -> parent
// 3    bits -> param type
// 5    bits -> operator
const offsetParent = 8
const offsetParamType = 5
const offsetOperator = 0

const packCondition = (condition: ConditionFlat) =>
  hexZeroPad(
    hexlify(
      (condition.parent << offsetParent) |
        (condition.paramType << offsetParamType) |
        (condition.operator << offsetOperator)
    ),
    2
  )

const packCompValue = (condition: ConditionFlat) => {
  if (!hasCompValue(condition.operator)) return "0x"
  if (!condition.compValue) {
    throw new Error(
      `compValue is required for operator ${Operator[condition.operator]}`
    )
  }

  return condition.operator === Operator.EqualTo
    ? keccak256(condition.compValue)
    : encodeAbiParameters(["bytes32"], [condition.compValue])
}

const removeExtraneousOffsets = (conditions: ConditionFlat[]) => {
  for (let i = 0; i < conditions.length; i++) {
    if (
      conditions[i].compValue &&
      conditions[i].operator == Operator.EqualTo &&
      !isInline(conditions, i)
    ) {
      conditions[i].compValue = "0x" + conditions[i].compValue!.slice(66)
    }
  }
}

const isInline = (conditions: ConditionFlat[], index: number) => {
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

const initCodeFor = (bytecode: BytesLike) =>
  concat([
    "0x63",
    hexZeroPad(BigNumber.from(hexDataLength(bytecode) + 1).toHexString(), 4),
    "0x80600E6000396000F3",
    "0x00",
    bytecode,
  ])

const hasCompValue = (operator: Operator) => operator >= Operator.EqualTo
