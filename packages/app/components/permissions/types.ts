import { OpenAPIV3 } from "openapi-types"
import { PermissionCoerced } from "zodiac-roles-sdk"

export type OpenAPIParameter = Omit<OpenAPIV3.ParameterObject, "schema"> & {
  schema: OpenAPIV3.SchemaObject
}

export interface Preset {
  permissions: PermissionCoerced[]
  uri: String
  serverUrl: String
  apiInfo: OpenAPIV3.InfoObject
  pathKey: string
  pathParams: Record<string, string | number>
  queryParams: Record<string, string | number | string[] | number[]>
  operation: {
    summary?: string
    description?: string
    tags?: string[]
    parameters: OpenAPIParameter[]
  }
}

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
