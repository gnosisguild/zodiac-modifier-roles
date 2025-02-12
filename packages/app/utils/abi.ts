import { AbiParameter } from "viem"

export const isStaticType = (abi: AbiParameter): boolean => {
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

const getArrayComponents = (
  type: string
): [length: number | null, innerType: string] | null => {
  const matches = type.match(/^(.*)\[(\d+)?\]$/)
  return matches ? [matches[2] ? Number(matches[2]) : null, matches[1]] : null
}
