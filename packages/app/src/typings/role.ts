export enum ExecutionOptions {
  NONE = "None",
  SEND = "Send",
  DELEGATE_CALL = "DelegateCall",
  BOTH = "Both",
}

export type Role = {
  id: string
  rolesModifier: string
  targets: Target[]
  members: { member: Member }[]
}

export type Target = {
  id?: string
  address: string
  executionOptions: ExecutionOptions
}

export type Member = {
  id: string
  address: string
}
