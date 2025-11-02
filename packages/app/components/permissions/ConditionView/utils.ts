import { arrayElementType, isStaticType } from "@/utils/abi"
import { AbiFunction, AbiParameter } from "viem"
import { AbiType, Condition, Operator } from "zodiac-roles-sdk"

/** Validates if the given ABI fragments matches the condition node's paramType */
export const matchesAbi = (
  condition: Condition,
  abi: AbiFunction | AbiParameter
): boolean => {
  switch (condition.paramType) {
    case AbiType.None:
      return true
    case AbiType.Static:
      return abi.type !== "function" && isStaticType(abi)
    case AbiType.Dynamic:
      return abi.type === "function" || !isStaticType(abi)
    case AbiType.Tuple:
      return "components" in abi && !!abi.components && !arrayElementType(abi)
    case AbiType.Array:
      const elementType = arrayElementType(abi)
      return !!elementType
    case AbiType.Calldata:
      abi.type === "bytes" || abi.type === "function"
    case AbiType.AbiEncoded:
      return abi.type === "bytes"
  }
}

/** Validates if the given ABI fragment matches the condition's type tree, also checking all children conditions */
// export const matchesAbiRecursive = (
//   condition: Condition,
//   abi: AbiFunction | AbiParameter
// ): boolean => {
//   if (!matchesAbi(condition, abi)) return false

//   const children = condition.children || []
//   switch (condition.paramType) {
//     case ParameterType.None:
//       return children.every((child) => matchesAbi(child, abi)) || true
//     case ParameterType.Tuple:
//       return children.every(
//         (child, i) =>
//           "components" in abi &&
//           !!abi.components &&
//           matchesAbi(child, abi.components[i])
//       )
//     case ParameterType.Array:
//       const elementType = arrayElementType(abi)
//       return (
//         !!elementType &&
//         (condition.children || []).every((child) =>
//           matchesAbi(child, elementType)
//         )
//       )
//     case ParameterType.Calldata:
//       abi.type === "function" &&
//         children.every((child, i) =>
//           matchesAbi(child, (abi as AbiFunction).inputs[i])
//         )
//   }

//   return true
// }

export const isLogicalOperator = (operator: Operator) =>
  operator >= Operator.And && operator <= Operator.Nor

export const isArrayOperator = (operator: Operator) =>
  operator >= Operator.ArrayEvery && operator <= Operator.ArraySubset
