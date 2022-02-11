export enum ExecutionOption {
  NONE = "None",
  SEND = "Send",
  DELEGATE_CALL = "DelegateCall",
  BOTH = "Both",
}

export type Role = {
  id: string
  targets: Target[]
  members: Member[]
}

export type Target = {
  id?: string
  address: string
  executionOptions: ExecutionOption
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
