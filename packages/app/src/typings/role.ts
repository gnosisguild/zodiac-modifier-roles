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
  funcParams?: FuncParams
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
