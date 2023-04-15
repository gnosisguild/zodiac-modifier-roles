import { defaultAbiCoder, ParamType } from "ethers/lib/utils"

import { ParameterType, Condition, Operator } from "../../../types"
import { Placeholder } from "../../types"

export const encodeValue = (
  value: any,
  type?: ParamType
): string | Placeholder<any> => {
  if (value instanceof Placeholder) {
    if (type && type.format("sighash") !== value.type.format("sighash")) {
      console.warn(
        `Placeholder type \`${value.type.format(
          "sighash"
        )}\` does not match expected type \`${type.format(
          "sighash"
        )}\`, casting the placeholder to the expected type`
      )
    }
    return type ? value.as(type) : value
  } else {
    if (!type) {
      throw new Error("the value type must be specified")
    }
    return defaultAbiCoder.encode([type], [value])
  }
}

export const parameterType = (type: ParamType): ParameterType => {
  switch (type.baseType) {
    case "tuple":
      return ParameterType.Tuple
    case "array":
      return ParameterType.Array
    case "string":
    case "bytes":
      return ParameterType.Dynamic
    default:
      return ParameterType.Static
  }
}

export const describeStructure = (type: ParamType): Condition => {
  const children = type.arrayChildren
    ? [type.arrayChildren]
    : (type.components as ParamType[] | undefined) // ethers typings are wrong

  return {
    paramType: parameterType(type),
    operator: Operator.Pass,
    children:
      children && children.length > 0
        ? children.map(describeStructure)
        : undefined,
  }
}
