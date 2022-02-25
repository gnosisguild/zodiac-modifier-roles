export enum ExecutionOption {
  NONE = "None",
  SEND = "Send",
  DELEGATE_CALL = "DelegateCall",
  BOTH = "Both",
}

export type Role = {
  id: string
  name: string
  targets: Target[]
  members: Member[]
}

export type Target = {
  id: string
  address: string
  executionOptions: ExecutionOption
  conditions: TargetConditions
}

export type Member = {
  id: string
  address: string
}

export enum EntityStatus {
  REMOVE,
  PENDING,
  NONE,
}

export const EXECUTION_OPTIONS: ExecutionOption[] = [
  ExecutionOption.NONE,
  ExecutionOption.SEND,
  ExecutionOption.DELEGATE_CALL,
  ExecutionOption.BOTH,
]

export type FuncParams = Record<string, boolean[]>

export interface ParamCondition {
  type: ParameterType
  condition: ParamComparison
  value?: string
}

export enum ParamComparison {
  EQUAL_TO = "EqualTo",
  ONE_OF = "OneOf",
  GREATER_THAN = "GreaterThan",
  LESS_THAN = "LessThan",
}

export enum ParameterType {
  STATIC,
  DYNAMIC,
  DYNAMIC32,
}

export enum ParamNativeType {
  INT,
  BOOLEAN,
  BYTES,
  ADDRESS,
  STRING,
  ARRAY,
  TUPLE,

  UNSUPPORTED,
}

export enum ConditionType {
  BLOCKED,
  WILDCARDED,
  SCOPED,
}

export interface FunctionConditions {
  type: ConditionType
  executionOption: ExecutionOption
  params: (ParamCondition | undefined)[]
}

export type TargetConditions = {
  type: ConditionType
  functions: Record<string, FunctionConditions>
}
