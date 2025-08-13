import { Condition, ExecutionOptions } from "zodiac-roles-deployments"

export type Call =
  | AllowTargetCall
  | ScopeTargetCall
  | RevokeTargetCall
  | AllowFunctionCall
  | ScopeFunctionCall
  | RevokeFunctionCall
  | AssignRolesCall
  | SetAllowanceCall
  | PostAnnotationsCall

interface AllowTargetCall {
  call: "allowTarget"
  roleKey: `0x${string}`
  targetAddress: `0x${string}`
  executionOptions: ExecutionOptions
}

interface ScopeTargetCall {
  call: "scopeTarget"
  roleKey: `0x${string}`
  targetAddress: `0x${string}`
}
interface RevokeTargetCall {
  call: "revokeTarget"
  roleKey: `0x${string}`
  targetAddress: `0x${string}`
}

interface AllowFunctionCall {
  call: "allowFunction"
  roleKey: `0x${string}`
  targetAddress: `0x${string}`
  selector: `0x${string}`
  executionOptions: ExecutionOptions
}

interface ScopeFunctionCall {
  call: "scopeFunction"
  roleKey: `0x${string}`
  targetAddress: `0x${string}`
  selector: `0x${string}`
  condition: Condition
  executionOptions: ExecutionOptions
}

interface RevokeFunctionCall {
  call: "revokeFunction"
  roleKey: `0x${string}`
  targetAddress: `0x${string}`
  selector: `0x${string}`
}

interface AssignRolesCall {
  call: "assignRoles"
  roleKey: `0x${string}`
  member: `0x${string}`
  join: boolean
}

interface SetAllowanceCall {
  call: "setAllowance"
  key: `0x${string}`
  balance: bigint
  maxRefill: bigint
  refill: bigint
  period: bigint
  timestamp: bigint
}

interface PostAnnotationsCall {
  call: "postAnnotations"
  roleKey: `0x${string}`
  body: {
    addAnnotations?: {
      uris: string[]
      schema: string
    }[]
    removeAnnotations?: string[]
  }
}
