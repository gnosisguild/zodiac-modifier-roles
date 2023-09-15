export enum ExecutionOption {
  NONE,
  SEND,
  DELEGATE_CALL,
  BOTH,
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

export type FuncParams = Record<string, boolean[]>

export interface ParamCondition {
  index: number
  type: ParameterType
  condition: ParamComparison
  value: string[]
}

export enum ParamComparison {
  EQUAL_TO = "EqualTo",
  ONE_OF = "OneOf",
  GREATER_THAN = "GreaterThan",
  LESS_THAN = "LessThan",
}

export enum ParameterType {
  STATIC = "Static",
  DYNAMIC = "Dynamic",
  DYNAMIC32 = "Dynamic32",
  NO_RESTRICTION = "NoRestriction",
}

export enum ParamNativeType {
  INT,
  BOOLEAN,
  BYTES,
  BYTES_FIXED,
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
  params: ParamCondition[]
}

export interface ConditionalEntity {
  type: ConditionType
  executionOption: ExecutionOption
}

export type TargetConditions = Record<string, FunctionCondition>
