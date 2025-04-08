import { ParamType } from "ethers"
import { AbiType } from "zodiac-roles-deployments"

export const parameterType = (type: ParamType): AbiType => {
  switch (type.baseType) {
    case "tuple":
      return AbiType.Tuple
    case "array":
      return AbiType.Array
    case "string":
    case "bytes":
      return AbiType.Dynamic
    default:
      return AbiType.Static
  }
}
