import { Operator, ParameterType } from "../types"

export interface ConditionFlat {
  parent: number
  paramType: ParameterType
  operator: Operator
  compValue?: string
}
