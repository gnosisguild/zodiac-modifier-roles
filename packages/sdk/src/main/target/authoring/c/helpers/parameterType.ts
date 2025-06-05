import { ParamType } from "ethers"
import { ParameterType } from "zodiac-roles-deployments"

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
