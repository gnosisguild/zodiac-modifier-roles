import { ParamType } from "ethers"
import { Encoding } from "zodiac-roles-deployments"

export const parameterType = (type: ParamType): Encoding => {
  switch (type.baseType) {
    case "tuple":
      return Encoding.Tuple
    case "array":
      return Encoding.Array
    case "string":
    case "bytes":
      return Encoding.Dynamic
    default:
      return Encoding.Static
  }
}
