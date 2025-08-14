import {
  RolesModifier,
  Function,
  Role,
  Target,
  Allowance,
} from "zodiac-roles-deployments"

type _Target = Partial<Omit<Target, "functions">>
export type TargetPartial = _Target & {
  address: `0x${string}`
  functions?: Function[] | Record<`0x${string}`, Function>
}

type _Role = Partial<Omit<Role, "targets" | "lastUpdated">>
export type RolePartial = _Role & {
  key: `0x${string}`
  targets?: TargetPartial[] | Record<`0x${string}`, TargetPartial>
}

export type AllowancePartial = Partial<Allowance> & { key: `0x${string}` }

type _RolesModifier = Partial<Omit<RolesModifier, "roles" | "allowances">>

export type RolesModifierPartial = _RolesModifier & {
  address: `0x${string}`
  roles: RolePartial[] | Record<`0x${string}`, RolePartial>
  allowances: AllowancePartial[] | Record<`0x${string}`, AllowancePartial>
}
