export type Role = {
  id: string
  rolesModifier: string
  targets: { id: string; address: string }[]
  members: { member: { id: string; address: string } }[]
}
