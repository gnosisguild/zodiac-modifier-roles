import { ParamType } from "ethers"
import { Condition, Operator } from "zodiac-roles-deployments"

import { parameterType } from "./parameterType"

/**
 * Given an ABI param type, generates a tree of Pass nodes that matches the structure of the type
 */
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
