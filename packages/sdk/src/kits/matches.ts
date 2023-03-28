import { ParamType } from "ethers/lib/utils"

import * as l2 from "../presets/helpers"
import { PresetCondition } from "../presets/types"

import { mapScoping } from "./mapScoping"
import { StructScoping, TupleScoping } from "./types"

// build layer 3 (typed allow kit) matches helpers based on layer 2 (permission preset condition helpers)

export const matches =
  <S extends TupleScoping<any> | StructScoping<any>>(scoping: S) =>
  (abiType: ParamType) => {
    if (Array.isArray(scoping)) {
      // scoping is an array (TupleScoping)

      // supported for tuple and array types
      if (abiType.baseType !== "tuple" && abiType.baseType !== "array") {
        throw new Error(
          `Can only use \`matches\` on tuple or array type params, got: ${abiType.type}`
        )
      }

      // map scoping items to conditions
      const conditions = scoping.map((scoping, index) =>
        mapScoping(
          scoping,
          abiType.baseType === "tuple"
            ? abiType.components[index]
            : abiType.arrayChildren
        )
      )
      return l2.matches(conditions, abiType)
    } else {
      // scoping is an object (StructScoping)

      // only supported for tuple types
      if (abiType.baseType !== "tuple") {
        throw new Error(
          `Can only use \`matches\` with scoping object on tuple type params, got: ${abiType.type}`
        )
      }

      // map scoping values to conditions
      const conditions = Object.fromEntries(
        Object.entries(scoping).map(([name, scoping]) => {
          const componentType = abiType.components.find(
            (component) => component.name === name
          )
          if (!componentType) {
            throw new Error(
              `Component ${name} not found in abi type ${abiType.type}`
            )
          }
          return [name, mapScoping(scoping, componentType)] as const
        })
      )
      return l2.matches(conditions, abiType)
    }
  }

export const matchesAbi =
  <S extends TupleScoping<any>>(scoping: S, abiTypes: ParamType[]) =>
  (abiType?: ParamType) => {
    // only supported at the top level or for bytes type params
    if (abiType && abiType.name !== "bytes") {
      throw new Error(
        `Can only use \`matchesAbi\` on bytes types params, got: ${abiType.type}`
      )
    }

    // map scoping items to conditions
    const conditions: (PresetCondition | undefined)[] = abiTypes.map(
      (type, index) => mapScoping(scoping[index], type)
    )
    return l2.matchesAbi(conditions, abiTypes)
  }
