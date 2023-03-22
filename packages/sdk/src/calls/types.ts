import { ExecutionOptions, Operator, ParameterType } from "../types"

interface AllowTargetCall {
  call: "allowTarget"
  targetAddress: string
  options: ExecutionOptions
}

interface ScopeTargetCall {
  call: "scopeTarget"
  targetAddress: string
}

interface ScopeAllowFunctionCall {
  call: "scopeAllowFunction"
  targetAddress: string
  functionSig: string
  options: ExecutionOptions
}

interface ScopeFunctionCall {
  call: "scopeFunction"
  targetAddress: string
  functionSig: string
  isParamScoped: boolean[]
  paramType: ParameterType[]
  paramComp: (Operator.EqualTo | Operator.GreaterThan | Operator.LessThan)[]
  compValue: string[]
  options: ExecutionOptions
}

interface ScopeParameterAsOneOfCall {
  call: "scopeParameterAsOneOf"
  targetAddress: string
  functionSig: string
  paramIndex: number
  type: ParameterType
  value: string[]
}

interface ScopeRevokeFunctionCall {
  call: "scopeRevokeFunction"
  targetAddress: string
  functionSig: string
}

interface RevokeTargetCall {
  call: "revokeTarget"
  targetAddress: string
}

export type Call =
  | AllowTargetCall
  | ScopeTargetCall
  | ScopeAllowFunctionCall
  | ScopeFunctionCall
  | ScopeParameterAsOneOfCall
  | ScopeRevokeFunctionCall
  | RevokeTargetCall
