import { AbiParameter } from "viem"
import { AbiInput, ArrayRowValue, RowValue, StructValue } from "./types"
import { arrayElementType } from "@/utils/abi"
import { invariant } from "@epic-web/invariant"

/**
 * Spread array elements into separate columns for `indices` and `values`.
 * Each column has an `elements` field that contains the values to be displayed
 * and a `span` field that indicates the row span of the elements at the corresponding position.
 *
 * For arrays of objects, the arrays are pushed down to the object's leaf properties.
 *
 * Nested arrays are flattened into the `indices` and `values` columns. The `span` field is used to visualize the nesting structure:
 * Parent arrays have a `span` matching the sum of the lengths of their child arrays.
 *
 * @example
 * Primitive array:
 * ```
 * [ 'foo', 'bar' ]
 * ```
 * Result:
 * ```
 * {
 *   indices: { elements: [0, 1], span: [1, 1] },
 *   values: { elements: [ 'foo', 'bar' ], span: [1, 1] }
 * }
 * ```
 *
 * @example
 * Array of objects:
 * ```
 * [ { a: 0, b: 0 }, { a: 1, b: 1 } ]
 * ```
 * Result:
 * ```
 * {
 *   indices: { elements: [0, 1], span: [2, 2] },
 *   values: {
 *     a: { elements: [0, 1], span: [1, 1] },
 *     b: { elements: [0, 1], span: [1, 1] }
 *   }
 * }
 * ```
 *
 * @example
 * Objects with nested arrays:
 * ```
 * [
 *   { a: [ { x: 0 }, { x: 1 } ] },
 *   { a: [ { x: 2 } ] }
 * ]
 * ```
 * Result:
 * ```
 * {
 *   indices: { elements: [0, 1], span: [2, 1] },
 *   values: {
 *     a: {
 *       indices: { elements: [0, 1, 0], span: [1, 1, 1] },
 *       values: {
 *         x: { elements: [0, 1, 2], span: [1, 1, 1] }
 *       }
 *     }
 *   }
 * }
 * ```
 *
 * @example
 * Nested arrays:
 * ```
 * [
 *   [ { x: 0 }, { x: 1 } ],
 *   [ { x: 3 } ],
 * ]
 * ```
 * Result:
 * ```
 * {
 *   indices: { elements: [0, 1], span: [2, 1] },
 *   values: {
 *     indices: { elements: [0, 1, 0], span: [1, 1, 1] },
 *     values: {
 *       x: { elements: [0, 1, 3], span: [1, 1, 1] }
 *     }
 *   }
 * }
 * ```
 *
 * @param values - The values to distribute.
 * @param params - The parameters of the ABI.
 * @returns The distributed values.
 */
export const distributeArrayElements = (
  value: AbiInput
  //   params: readonly AbiParameter[]
): RowValue => {
  if (Array.isArray(value)) {
    /**
     * Array: push down elements to the leaf values
     */

    if (value.length === 0) {
      // Empty arrays are treated as primitive values rather than being pushed down to leaf values.
      // While this creates a slight inconsistency with non-empty arrays, it simplifies the implementation
      // by removing the need for type information (AbiParameter[]) to be passed in.
      return {
        indices: { elements: [], span: [] },
        values: { elements: [], span: [] },
      }
    }

    const elementSpans = value.map((v) => totalNestedLength(v))

    const firstElement = value[0]
    if (Array.isArray(firstElement)) {
      // Array of arrays: recurse into each element and flatten the results
      const rowValues = value.map(
        (v) => distributeArrayElements(v) as ArrayRowValue
      )
      return {
        indices: { elements: [...value.keys()], span: elementSpans },
        values: {
          indices: { elements: [], span: [] },
          values: rowValues.flatMap((v) => v.values),
          // elements: rowValues.flatMap((v) => v.),
          // span: rowValues.flatMap((v) => v.values.span),
        },
      }
    } else if (typeof firstElement === "object" && firstElement !== null) {
      // Array of objects: push array down to leaves or until hitting other array properties.
      // Then recurse into the resulting object.
      const spans = Object.values(value).map((v) => totalNestedLength(v))
      const distributed = distributeArrayToProperties(
        value as Record<string, any>[]
      )

      return {
        indices: { elements: [], span: [] },
        values: distributeArrayElements(distributed),
      }
    } else {
      // Array of primitive values:
      return // TODO
    }
  }

  if (typeof value === "object" && value !== null) {
    /**
     * Object: recurse into each property
     */
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [
        key,
        distributeArrayElements(val),
      ])
    )
  }

  /**
   * Primitive value: return it as is
   */
  return value
}
// export const distributeArrayElements = (
//   value: AbiInput
//   //   params: readonly AbiParameter[]
// ): RowValue => {
//   if (Array.isArray(value)) {
//     if (value.length === 0)
//       return {
//         indices: { elements: [], span: [] },
//         values: { elements: [], span: [] },
//       }

//     const firstElement = value[0]
//     if (Array.isArray(firstElement)) {
//       // nested array: flatten it
//       const {
//         elements,
//         indices,
//         span: indexSpans,
//       } = flattenNestedArray(value as AbiInput[][])
//       const elementSpans = elements.map((element) => totalNestedLength(element))

//       // indexSpan describe how many elements are spanned by each index
//       // To derive the total span of each index, we need to sum up the spans of all elements that fall under it.
//       let spanned = 0
//       const totalIndexSpans = indexSpans.map((span) => {
//         let total = 0
//         for (let j = 0; j < span; j++) {
//           total += elementSpans[spanned + j]
//         }
//         spanned += span
//         return total
//       })

//       return {
//         indices: { elements: indices, span: totalIndexSpans },
//         values: {
//           // recurse into each element
//           elements: elements.map((element) => distributeArrayElements(element)),
//           span: elementSpans,
//         },
//       }
//     } else {
//       // primitive array: distribute the elements
//       return distributeArrayElements(firstElement)
//     }
//   } else if (typeof value === "object" && value !== null) {
//   } else {
//     return value
//   }
// }

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
