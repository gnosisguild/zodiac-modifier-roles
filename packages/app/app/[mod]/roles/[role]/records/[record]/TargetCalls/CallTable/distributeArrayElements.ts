import { AbiParameter } from "viem"
import {
  AbiInput,
  ArrayRowValue,
  NestedArrayValues,
  RowValue,
  StructRowValue,
} from "./types"
import { invariant } from "@epic-web/invariant"

/**
 * Spread array elements into separate columns for `indices` and `values`.
 *
 * For arrays of objects, the arrays are pushed down to the object's leaf properties.
 *
 * For nested arrays the original nesting structure is preserved in the `indices` and `values` column leaves.
 *
 * In order to keep all column leaf values aligned when rendering sub rows, they carry a `span` field
 * that indicates the total number of rows spanned.
 *
 * @example
 * Primitive array:
 * ```
 * [ 'foo', 'bar' ]
 * ```
 * Result:
 * ```
 * {
 *   indices: { children: [ { value: 0, span: 1 }, { value: 1, span: 1 } ], span: 2 },
 *   values: { children: [ { value: 'foo', span: 1 }, { value: 'bar', span: 1 } ], span: 2 },
 * }
 * ```
 *
 * @example
 * Array of objects:
 * ```
 * [ { a: 0, b: 10 }, { a: 1, b: 11 } ]
 * ```
 * Result:
 * ```
 * {
 *   indices: { children: [ { value: 0, span: 1 }, { value: 1, span: 1 } ], span: 2 },
 *   values: {
 *     a: { children: [ { value: 0, span: 1 }, { value: 1, span: 1 } ], span: 2 },
 *     b: { children: [ { value: 10, span: 1 }, { value: 11, span: 1 } ], span: 2 }
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
 *   indices: { children: [ { value: 0, span: 2 }, { value: 1, span: 1 } ], span: 3 }
 *   values: {
 *     a: {
 *       indices: {
 *         children: [
 *           {
 *             children: [ { value: 0, span: 1 }, { value: 1, span: 1 } ],
 *             span: 2
 *           },
 *           {
 *             children: [ { value: 2, span: 1 } ],
 *             span: 1
 *           }
 *         ],
 *         span: 3
 *       },
 *       values: {
 *         x: {
 *           children: [
 *             { children: [ { value: 0, span: 1 }, { value: 1, span: 1 } ], span: 2 },
 *             { children: [ { value: 2, span: 1 } ], span: 1 }
 *           ],
 *           span: 3
 *         }
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
 *   indices: {
 *     children: [ { value: 0, span: 2 }, { value: 1, span: 1 } ],
 *     span: 3
 *   },
 *   values: {
 *     indices: { elements: [0, 1, 0], span: [1, 1, 1] },
 *     indices: {
 *       children: [
 *         { children: [ { value: 0, span: 1 }, { value: 1, span: 1 } ], span: 2 },
 *         { children: [ { value: 3, span: 1 } ], span: 1 }
 *       ],
 *       span: 3
 *     },
 *     values: {
 *       x: {
 *         children: [
 *           { children: [ { value: 0, span: 1 }, { value: 1, span: 1 } ], span: 2 },
 *           { children: [ { value: 3, span: 1 } ], span: 1 }
 *         ],
 *         span: 3
 *       }
 *     }
 *   }
 * }
 * ```
 *
 * @param values - The values to distribute.
 * @param params - The parameters of the ABI.
 * @returns The distributed values.
 */
export const distributeArrayElements = (value: AbiInput): RowValue => {
  if (Array.isArray(value)) {
    /**
     * Array: push down elements to the leaf values
     */

    if (value.length === 0) {
      // Empty arrays are treated as primitive values rather than being pushed down to leaf values.
      // While this creates a slight inconsistency with non-empty arrays, it simplifies the implementation
      // by removing the need for type information (AbiParameter[]) to be passed in.
      const emptyArray: ArrayRowValue = {
        indices: { span: 0, children: [] },
        values: { span: 0, children: [] },
      }
      return emptyArray
    }

    // Recurse into each element
    const rowValues = value.map((v) => distributeArrayElements(v))

    // Now we have an array of row values, which may or may now contain array structures at the leaf level.
    // We need to distribute the array elements to the leaf values and then wrap the whole thing in an array row value.
    const values = distributeArrayToLeaves(rowValues)

    // Calculate the span of the row values and create the indices column
    const rowSpans = rowValues.map(totalSpan)
    const span = rowSpans.reduce((total, span) => total + span, 0)

    return {
      indices: {
        children: rowSpans.map((span, index) => ({ value: index, span })),
        span,
      },
      values,
    } as ArrayRowValue
  }

  if (typeof value === "object" && value !== null) {
    /**
     * Object: recurse into each property
     */
    const result: StructRowValue = Object.fromEntries(
      Object.entries(value).map(([key, val]) => [
        key,
        distributeArrayElements(val),
      ])
    )
    return result
  }

  /**
   * Primitive value: return it as is
   */
  return value
}

const isNestedArrayValues = (value: RowValue): value is NestedArrayValues => {
  return (
    typeof value === "object" &&
    "span" in value &&
    "children" in value &&
    Array.isArray(value.children)
  )
}

const isStructRowValue = (value: RowValue): value is StructRowValue => {
  return !Array.isArray(value) && typeof value === "object" && value !== null
}

export function distributeArrayToLeaves(
  array: RowValue[],
  siblingSpan = 1 // The maximum span of sibling elements
): RowValue {
  if (array.length === 0) throw new Error("array is empty")

  // Since all elements have the same type we use first object to determine the structure
  const firstValue = array[0]

  if (isNestedArrayValues(firstValue)) {
    // Once we hit a nested array, we can wrap ours around it and stop recursing

    const nestedArrayValues = array as NestedArrayValues[]
    const span = nestedArrayValues.reduce((total, { span }) => total + span, 0)

    return {
      children: nestedArrayValues,
      span: Math.max(span, siblingSpan),
    } as NestedArrayValues
  }

  if (isStructRowValue(firstValue)) {
    // If the element type is an object, recursively distribute to its properties

    const nestedArrayValues = array as StructRowValue[]
    const maxSiblingSpan = Math.max(
      siblingSpan,
      ...nestedArrayValues.map(totalSpan)
    )

    return Object.fromEntries(
      Object.keys(firstValue).map((key) => [
        key,
        distributeArrayToLeaves(
          nestedArrayValues.map((v) => v[key]),
          maxSiblingSpan
        ),
      ])
    ) as StructRowValue
  }

  const isPrimitiveValue =
    typeof firstValue === "string" ||
    typeof firstValue === "number" ||
    typeof firstValue === "boolean" ||
    typeof firstValue === "bigint"
  if (!isPrimitiveValue) throw new Error("unexpected non-primitive row value")

  const primitiveValues = array as (typeof firstValue)[]

  return {
    children: primitiveValues.map((v) => ({
      value: v,
      span: 1,
    })),
    span: Math.max(primitiveValues.length, siblingSpan),
  } as NestedArrayValues
}

const totalSpan = (value: RowValue): number => {
  if (isNestedArrayValues(value)) {
    return value.span
  }
  if (isStructRowValue(value)) {
    return Math.max(...Object.values(value).map((v) => totalSpan(v)))
  }
  return 1
}
