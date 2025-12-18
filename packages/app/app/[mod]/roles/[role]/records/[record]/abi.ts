import { AbiParameter } from "viem"
import { invariant } from "@epic-web/invariant"
import { arrayElementType, tupleValues } from "@/utils/abi"

export type PrimitiveValue = string | boolean | number | bigint

export type AbiInput = StructAbiInput | AbiInput[] | PrimitiveValue

export type StructAbiInput = {
  [key: string]: AbiInput
}

/**
 * Deeply map the decoded ABI params so that structs values are represented as objects.
 * Values of unnamed struct components will be stored as `[${index}]` properties.
 **/
export const mapAbiInputs = (
  inputs: readonly AbiParameter[],
  values: readonly unknown[]
): StructAbiInput => {
  return Object.fromEntries(
    inputs.map((input, index) => {
      let value = values[index] as AbiInput

      // We only need to map the nested fields if the current input is a tuple or an (multi-dimensional) array of tuples.
      // In either case, the tuple's components will already be defined on input.components.
      if ("components" in input) {
        const isArrayParam = arrayElementType(input) != null
        if (isArrayParam) {
          invariant(
            Array.isArray(value),
            "expected array value for array param"
          )
          value = mapAbiInputsInArray(input, value)
        } else {
          value = mapAbiInputs(
            input.components,
            tupleValues(value, input.components)
          )
        }
      }
      return [input.name ?? `[${index}]`, value]
    })
  )
}

const mapAbiInputsInArray = (
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
      ? mapAbiInputsInArray(elementType, value)
      : mapAbiInputs(
          elementType.components,
          tupleValues(value, elementType.components)
        )
  )
}
