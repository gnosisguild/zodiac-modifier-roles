import { arrayElementType } from "@/utils/abi"
import { invariant } from "@epic-web/invariant"
import { AbiParameter } from "viem"

/** Returns the maximum _nested_ array length for the given inputs.  */
export const maxArrayLength = (
  values: any[],
  inputs: readonly AbiParameter[]
): number => {
  const maxLengths = inputs.map((input, index) => {
    const value = values[index]
    const elementType = arrayElementType(input)
    const isTuple = input.type === "tuple" && "components" in input

    if (isTuple) {
      invariant(
        typeof value === "object" && !Array.isArray(value) && value !== null,
        "Expected object for tuple"
      )
      return maxArrayLength(Object.values(value), input.components)
    }

    if (elementType) {
      invariant(Array.isArray(value), "Expected array for array")
      const itemLengths = value.map((itemValue) =>
        maxArrayLength([itemValue], [elementType])
      )
      return itemLengths.reduce((sum, length) => sum + length, 0)
    }

    return 1
  })

  return Math.max(...maxLengths)
}
