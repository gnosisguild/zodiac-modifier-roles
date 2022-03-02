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

export interface Target extends ConditionalEntity {
  id: string
  address: string
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
  index: number
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
  BLOCKED = "None",
  WILDCARDED = "Target",
  SCOPED = "Function",
}

export interface FunctionCondition extends ConditionalEntity {
  sighash: string
  params: (ParamCondition | undefined)[]
}

export interface ConditionalEntity {
  type: ConditionType
  executionOption: ExecutionOption
}

export type TargetConditions = Record<string, FunctionCondition>
