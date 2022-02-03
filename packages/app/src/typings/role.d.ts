export type Role = {
  id: string
  rolesModifier: string
  targets: Target[]
  members: { member: Member }[]
}

export type Target = {
  id: string
  address: string
}

export type Member = {
  id: string
  address: string
}
