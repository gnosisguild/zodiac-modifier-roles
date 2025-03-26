import { AbiParameter } from "viem"
import { invariant } from "@epic-web/invariant"
import { arrayElementType } from "@/utils/abi"
import { AbiInput, StructAbiInput } from "./types"

/**
 * Deeply map the decoded ABI params making sure that any unnamed tuple fields will be named as `[${index}]`
 **/
export const ensureFieldNames = (
  inputs: readonly AbiParameter[],
  values: readonly unknown[]
): StructAbiInput => {
  return Object.fromEntries(
    inputs.map((input, index) => {
      let value = values[index] as AbiInput

      // We only need to map the nested fields if the current input is a tuple or an (multi-dimensional) array of tuples
      // In either case, the tuple's components will already be defined on input.components
      if ("components" in input) {
        const isArrayParam = arrayElementType(input) != null
        if (isArrayParam) {
          value = ensureFieldNamesInArray(input, value)
        } else {
          invariant(
            Array.isArray(value),
            "expected array value for tuple param"
          )
          value = ensureFieldNames(input.components, value)
        }
      }
      return [input.name ?? `[${index}]`, value]
    })
  )
}

const ensureFieldNamesInArray = (
  input: AbiParameter,
  values: unknown
): AbiInput => {
  const elementType = arrayElementType(input)
  invariant(elementType != null, "expected array param")
  invariant(Array.isArray(values), "expected array value for array param")
  invariant("components" in elementType, "expected array of tuples")

  const isNestedArray = arrayElementType(elementType) != null

  return values.map((value) =>
    isNestedArray
      ? ensureFieldNamesInArray(elementType, value)
      : ensureFieldNames(elementType.components, value)
  )
}
