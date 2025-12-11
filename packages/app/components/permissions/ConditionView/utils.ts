import { arrayElementType, isStaticType } from "@/utils/abi"
import { AbiFunction, AbiParameter } from "viem"
import { Encoding, Condition, Operator } from "zodiac-roles-sdk"

/** Validates if the given ABI fragments matches the condition node's paramType */
export const matchesAbi = (
  condition: Condition,
  abi: AbiFunction | AbiParameter
): boolean => {
  switch (condition.paramType) {
    case Encoding.None:
      return true
    case Encoding.Static:
      return abi.type !== "function" && isStaticType(abi)
    case Encoding.Dynamic:
      return abi.type === "function" || !isStaticType(abi)
    case Encoding.Tuple:
      return "components" in abi && !!abi.components && !arrayElementType(abi)
    case Encoding.Array:
      const elementType = arrayElementType(abi)
      return !!elementType
    case Encoding.AbiEncoded:
      return abi.type === "bytes" || abi.type === "function"
  }
}

export const isLogicalOperator = (operator: Operator) =>
  operator >= Operator.And && operator <= Operator.Nor

export const isArrayOperator = (operator: Operator) =>
  operator >= Operator.ArrayEvery && operator <= Operator.ArraySubset
