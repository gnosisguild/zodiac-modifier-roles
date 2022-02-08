export type ExecutionOptions = "None" | "Send" | "DelegateCall" | "Both"

export const ExecutionOptionsArray: Array<ExecutionOptions> = ["None", "Send", "DelegateCall", "Both"]

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
