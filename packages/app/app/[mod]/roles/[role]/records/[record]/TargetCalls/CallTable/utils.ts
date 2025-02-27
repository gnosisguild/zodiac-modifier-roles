import { AbiParameter } from "viem"
import { AbiInput } from "./types"
import { arrayElementType } from "@/utils/abi"
import { invariant } from "@epic-web/invariant"

/**
 * Distributes an array of objects into an object of arrays.
 * Each property of the resulting object corresponds to an array of values
 * from the original objects.
 *
 * @param arr - The array of objects to transform.
 * @returns An object where each property is an array of values.
 */
export function distributeArrayToPropertiesV1<T extends Record<string, any>>(
  arr: T[]
): Record<keyof T, any[]> {
  const result: Partial<Record<keyof T, any[]>> = {}

  for (const obj of arr) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (!result[key]) {
          result[key] = [] // Initialize the array if it doesn't exist
        }
        result[key].push(obj[key]) // Push the value into the corresponding array
      }
    }
  }

  return result as Record<keyof T, any[]> // Cast to the expected return type
}

/**
 * Distributes an array of objects into an object of arrays.
 * Each property of the resulting object corresponds to an array of values
 * from the original objects.
 *
 * For nested objects, arrays are pushed down to the leaf values.
 * When encountering another array, it creates a nested array structure.
 *
 * @example
 * Input: [{ a: { b: 1 } }, { a: { b: 2 } }]
 * Output: { a: { b: [1, 2] } }
 *
 * @example
 * Input: [{ a: [1, 2] }, { a: [3] }]
 * Output: { a: [[1, 2], [3]] }
 *
 * @param arr - The array of objects to transform.
 * @returns An object where each property contains either an array of values
 *          or a nested object with arrays at the leaf nodes.
 */
export function distributeArrayToProperties<T extends Record<string, any>>(
  arr: T[]
): Record<string, any> {
  const result: Record<string, any> = {}

  // If array is empty, return empty result
  if (arr.length === 0) return result

  // Get the first object to check property types
  const firstObj = arr[0]

  for (const key in firstObj) {
    if (!firstObj.hasOwnProperty(key)) continue

    const firstValue = firstObj[key]
    const allValues = arr.map((obj) => obj[key])

    if (Array.isArray(firstValue)) {
      // If the value is an array, collect all arrays at this level
      result[key] = allValues
    } else if (typeof firstValue === "object" && firstValue !== null) {
      // If the value is an object, recursively distribute its properties
      result[key] = distributeArrayToProperties(allValues)
    } else {
      // For primitive values, create a flat array
      result[key] = allValues
    }
  }

  return result
}

// Example usage:
const input = [
  {
    name: "Alice",
    scores: { math: 90, science: [95, 92] },
    tags: ["student", "senior"],
  },
  {
    name: "Bob",
    scores: { math: 85, science: [88] },
    tags: ["student", "junior"],
  },
]

/* Output:
{
  name: ["Alice", "Bob"],
  scores: {
    math: [90, 85],
    science: [[95, 92], [88]]
  },
  tags: [["student", "senior"], ["student", "junior"]]
}
*/

/**
 * Flattens a nested array (with one level of nesting) into a flat `elements` array,
 * an `indices` array tracking the indices of the top-level array, and a `span` array
 * indicating how many of the nested array elements fall under the corresponding index.
 *
 * @param nestedArray - The nested array to flatten.
 * @returns An object containing the `elements`, `indices`, and `span` arrays.
 */
export function flattenNestedArrayV1<T>(nestedArray: T[][]): {
  elements: T[]
  indices: number[]
  span: number[]
} {
  const elements: T[] = []
  const indices: number[] = []
  const span: number[] = []

  for (let i = 0; i < nestedArray.length; i++) {
    const subArray = nestedArray[i]
    indices.push(i)
    span.push(subArray.length)

    // Flatten the nested array elements into the elements array
    elements.push(...subArray)
  }

  return { elements, indices, span }
}

/**
 * Calculates the total number of elements in a nested array or
 * the max total length of any arrays nested within an object.
 *
 * @param nested - The nested array or object to calculate the total length for.
 * @returns The total number of elements in the nested structure.
 */
export function totalNestedLength(nested: any): number {
  if (Array.isArray(nested)) {
    // Array: calculate the total length recursively
    let totalLength = 0
    for (const item of nested) {
      totalLength += totalNestedLength(item)
    }
    return totalLength
  } else if (typeof nested === "object" && nested !== null) {
    // Object (struct): return the max length of any array nested within the struct
    let maxLength = 0
    for (const key in nested) {
      if (nested.hasOwnProperty(key)) {
        const length = totalNestedLength(nested[key])
        maxLength = Math.max(maxLength, length)
      }
    }
    return maxLength
  } else {
    // Primitive value: count as one element
    return 1
  }
}
