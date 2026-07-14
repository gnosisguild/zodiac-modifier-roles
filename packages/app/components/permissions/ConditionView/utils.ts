import { arrayElementType, isStaticType } from "@/utils/abi"
import { AbiFunction, AbiParameter } from "viem"
import { Condition, Operator, ParameterType } from "zodiac-roles-sdk"

/** Validates if the given ABI fragments matches the condition node's paramType */
export const matchesAbi = (
  condition: Condition,
  abi: AbiFunction | AbiParameter
): boolean => {
  switch (condition.paramType) {
    case ParameterType.None:
      return true
    case ParameterType.Static:
      return abi.type !== "function" && isStaticType(abi)
    case ParameterType.Dynamic:
      return abi.type === "function" || !isStaticType(abi)
    case ParameterType.Tuple:
      return "components" in abi && !!abi.components && !arrayElementType(abi)
    case ParameterType.Array:
      const elementType = arrayElementType(abi)
      return !!elementType
    case ParameterType.Calldata:
      abi.type === "bytes" || abi.type === "function"
    case ParameterType.AbiEncoded:
      return abi.type === "bytes"
  }
}

export const isLogicalOperator = (operator: Operator) =>
  operator >= Operator.And && operator <= Operator.Or

export const isArrayOperator = (operator: Operator) =>
  operator == Operator.ArrayEvery
