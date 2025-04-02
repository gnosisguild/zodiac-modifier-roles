import { ParamType } from "ethers"
import { Operator } from "zodiac-roles-deployments"

import { describeStructure } from "./helpers/describeStructure"
import { parameterType } from "./helpers/parameterType"

/**
 * Allows any value to pass
 */
export const pass = (abiType: ParamType) => {
  const type = ParamType.from(abiType)
  const structure = describeStructure(type)
  return {
    paramType: parameterType(type),
    operator: Operator.Pass,
    children: structure.children,
  }
}
