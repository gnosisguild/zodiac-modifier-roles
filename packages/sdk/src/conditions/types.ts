import { Operator, ParameterType } from "zodiac-roles-deployments"

export interface ConditionFlat {
  parent: number
  paramType: ParameterType
  operator: Operator
  compValue?: string
}
