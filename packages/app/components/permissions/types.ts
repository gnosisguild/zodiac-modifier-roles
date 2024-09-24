import { PermissionCoerced } from "zodiac-roles-sdk"
import { Preset } from "zodiac-roles-sdk/annotations"

export enum DiffFlag {
  Added = "Added",
  Removed = "Removed",
  Modified = "Modified",
  Identical = "Identical",
  Hidden = "Hidden",
}

export type PermissionsDiff = Map<
  PermissionCoerced,
  { flag: DiffFlag; modified?: PermissionCoerced }
>

export type PresetsDiff = Map<
  Preset,
  { flag: DiffFlag; modified?: Preset; permissions?: PermissionsDiff }
>
