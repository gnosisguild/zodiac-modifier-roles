import { Condition, ExecutionOptions } from "../types"

interface AllowTargetCall {
  call: "allowTarget"
  targetAddress: string
  executionOptions: ExecutionOptions
}

interface ScopeTargetCall {
  call: "scopeTarget"
  targetAddress: string
}
interface RevokeTargetCall {
  call: "revokeTarget"
  targetAddress: string
}

interface AllowFunctionCall {
  call: "allowFunction"
  targetAddress: string
  selector: string
  executionOptions: ExecutionOptions
}

interface ScopeFunctionCall {
  call: "scopeFunction"
  targetAddress: string
  selector: string
  condition: Condition
  executionOptions: ExecutionOptions
}

interface RevokeFunctionCall {
  call: "revokeFunction"
  targetAddress: string
  selector: string
}

export type Call =
  | AllowTargetCall
  | ScopeTargetCall
  | RevokeTargetCall
  | AllowFunctionCall
  | ScopeFunctionCall
  | RevokeFunctionCall
