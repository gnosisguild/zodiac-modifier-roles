import { Condition, ExecutionOptions } from "zodiac-roles-deployments"

interface AllowTargetCall {
  call: "allowTarget"
  roleKey: string
  targetAddress: string
  executionOptions: ExecutionOptions
}

interface ScopeTargetCall {
  call: "scopeTarget"
  roleKey: string
  targetAddress: string
}
interface RevokeTargetCall {
  call: "revokeTarget"
  roleKey: string
  targetAddress: string
}

interface AllowFunctionCall {
  call: "allowFunction"
  roleKey: string
  targetAddress: string
  selector: string
  executionOptions: ExecutionOptions
}

interface ScopeFunctionCall {
  call: "scopeFunction"
  roleKey: string
  targetAddress: string
  selector: string
  condition: Condition
  executionOptions: ExecutionOptions
}

interface RevokeFunctionCall {
  call: "revokeFunction"
  roleKey: string
  targetAddress: string
  selector: string
}

interface AssignRolesCall {
  call: "assignRoles"
  roleKey: string
  member: string
  join: boolean
}

interface SetAllowanceCall {
  call: "setAllowance"
  key: string
  balance: bigint
  maxRefill: bigint
  refill: bigint
  period: bigint
  timestamp: bigint
}

export type Call =
  | AllowTargetCall
  | ScopeTargetCall
  | RevokeTargetCall
  | AllowFunctionCall
  | ScopeFunctionCall
  | RevokeFunctionCall
  | AssignRolesCall
  | SetAllowanceCall
