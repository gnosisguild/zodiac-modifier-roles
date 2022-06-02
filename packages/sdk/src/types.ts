import { AVATAR_ADDRESS_PLACEHOLDER } from "./placeholders"

export interface RolePreset {
  network: number
  allowTargets: AllowTarget[] // allows all calls to targets
  allowFunctions: AllowFunction[] // allows calls to specific functions, optionally with parameter scoping
}

export enum ExecutionOptions {
  None = 0,
  Send = 1,
  DelegateCall = 2,
  Both = 3,
}
export interface AllowTarget {
  targetAddress: string
  options?: ExecutionOptions
}

export interface AllowFunction {
  targetAddresses: string[]
  functionSig: string
  params?: (ScopeParam | undefined)[]
  options?: ExecutionOptions
}

export enum ParameterType {
  Static,
  Dynamic,
  Dynamic32,
}

export enum Comparison {
  EqualTo,
  GreaterThan,
  LessThan,
  OneOf,
}

export enum Clearance {
  None,
  Target,
  Function,
}

type Value = string | typeof AVATAR_ADDRESS_PLACEHOLDER
export interface ScopeParam {
  type: ParameterType
  comparison: Comparison
  value: Value | Value[]
}

export interface RolePermissions {
  id: string
  targets: {
    id: string
    address: string
    clearance: Clearance
    executionOptions: ExecutionOptions
    functions: {
      id: string
      sighash: string
      executionOptions: ExecutionOptions
      wildcarded: boolean
      parameters: {
        id: string
        index: number
        type: ParameterType
        comparison: Comparison
        comparisonValue: string
      }
    }[]
  }[]
}
