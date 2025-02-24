import { Row } from "./types"

/**
 * https://github.com/ag-grid/ag-grid/blob/66c006ba65fb52ca722fef8f70b98da8a25d469e/packages/ag-grid-enterprise/src/treeData/fieldAccess.ts#L4
 *
 * This is a modified version of the `makeFieldPathGetter` function from ag-grid.
 * It is used to get the value of a field in a row object.
 *
 * The original function is licensed under the MIT license: https://github.com/ag-grid/ag-grid/blob/latest/LICENSE.txt
 */
export const makeFieldPathGetter = (fieldPath: string) => {
  const segments = fieldPath.split(".")
  let result: any | null = null

  const last = segments.length - 1

  if (last === 0) {
    result = (data: Row | null | undefined) => (data as any)?.[fieldPath!]
  } else if (last > 0) {
    result = (data: Row | null | undefined) => {
      let value: any = data
      for (let i = 0; i <= last && value !== null && value !== undefined; ++i) {
        value = value[segments[i]]
        if (i < last && typeof value !== "object" && value !== undefined) {
          // TODO: maybe we should raise an error like 'Accessing a ' + typeof value + ' not allowed in field path'
          return null
        }
      }
      return value
    }
  } else {
    result = () => undefined
  }

  result.path = fieldPath
  return result as ((data: Row | null | undefined) => any) & { path: string }
}
