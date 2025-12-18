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

/**
 * Converts a tuple value (decoded by viem as an object) to an array in component order.
 *
 * viem decodes tuples as objects:
 * - Named components use their names as keys
 * - Unnamed components use numeric string keys ("0", "1", "2", etc.)
 *
 * This function preserves the order of components as defined in the ABI by mapping
 * over the components array, which is safer than using Object.values() when tuples
 * have a mix of named and unnamed components.
 *
 * @param tupleValue - The tuple value (object or array)
 * @param components - The ABI components array defining the tuple structure
 * @returns An array of values in component order
 */
export const tupleValues = (
  tupleValue: unknown,
  components: readonly AbiParameter[]
): unknown[] => {
  // If already an array, return as-is
  if (Array.isArray(tupleValue)) {
    return tupleValue
  }

  // Convert object to array in component order
  const obj = tupleValue as { [key: string]: unknown }
  return components.map((comp, compIndex) => {
    // Try named property first, then numeric string key for unnamed components
    // viem uses numeric string keys ("0", "1", "2") for unnamed tuple components
    return (
      (comp.name ? obj[comp.name] : obj[String(compIndex)]) ??
      (tupleValue as unknown[])[compIndex]
    )
  })
}
