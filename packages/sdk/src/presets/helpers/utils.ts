import { defaultAbiCoder, ParamType } from "ethers/lib/utils"

import { ParameterType, Condition, Operator } from "../../types"
import { AbiType, Placeholder } from "../types"

export const encodeValue = (
  value: any,
  type?: AbiType
): string | Placeholder<any> => {
  if (value instanceof Placeholder) {
    return type ? value.as(type) : value
  } else {
    if (!type) {
      throw new Error("the value type must be specified")
    }
    return defaultAbiCoder.encode([type], [value])
  }
}

export const parameterType = (type: AbiType): ParameterType => {
  const paramType = ParamType.from(type)
  switch (paramType.baseType) {
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

export const describeStructure = (type: AbiType): Condition => {
  const paramType = ParamType.from(type)
  const children = paramType.arrayChildren
    ? [paramType.arrayChildren]
    : paramType.components

  return {
    paramType: parameterType(type),
    operator: Operator.Pass,
    children: children.length > 0 ? children.map(describeStructure) : undefined,
  }
}
