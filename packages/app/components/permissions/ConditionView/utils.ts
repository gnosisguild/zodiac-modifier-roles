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
      return (
        "components" in abi && !!abi.components && !getArrayComponents(abi.type)
      )
    case ParameterType.Array:
      const elementType = arrayElementType(abi)
      return !!elementType
    case ParameterType.Calldata:
      abi.type === "bytes" || abi.type === "function"
    case ParameterType.AbiEncoded:
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

const isStaticType = (abi: AbiParameter): boolean => {
  if (
    abi.type === "bool" ||
    abi.type === "address" ||
    abi.type.startsWith("int") ||
    abi.type.startsWith("uint") ||
    abi.type.match(/bytes\d+/)
  ) {
    return true
  }

  const elementType = arrayElementType(abi)
  if (elementType) {
    // it's an array
    const [arrayLength] = getArrayComponents(abi.type)!
    return isStaticType(elementType) && arrayLength !== null
  }

  if ("components" in abi && abi.components) {
    return abi.components.every((component) => isStaticType(component))
  }

  return false
}

export const isLogicalOperator = (operator: Operator) =>
  operator >= Operator.And && operator <= Operator.Nor

export const isArrayOperator = (operator: Operator) =>
  operator >= Operator.ArrayEvery && operator <= Operator.ArraySubset

export const arrayElementType = (
  abi: AbiParameter
): AbiParameter | undefined => {
  const arrayComponents = getArrayComponents(abi.type)
  if (!arrayComponents) return undefined
  const [_length, elementType] = arrayComponents
  const [_, elementInternalType] =
    (abi.internalType && getArrayComponents(abi.internalType as string)) || []

  return {
    type: elementType,
    internalType: elementInternalType,
    // element tuple components are stored on the array type
    components: (abi as any).components,
  }
}

export const getArrayComponents = (
  type: string
): [length: number | null, innerType: string] | null => {
  const matches = type.match(/^(.*)\[(\d+)?\]$/)
  return matches ? [matches[2] ? Number(matches[2]) : null, matches[1]] : null
}
