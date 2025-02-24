 import { ParamType } from "ethers"
import { ParameterType, Condition, Operator } from "zodiac-roles-deployments"

import { abiEncode } from "../../utils/abiEncode"

 export const encodeValue = (value: any, type: ParamType): `0x${string}` => {
   return abiEncode([type], [value]) 
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
