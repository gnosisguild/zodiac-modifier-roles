import type { reconstructPermissions } from "zodiac-roles-sdk"
import { OpenApiObject, OpenApiOperation } from "./schema"

export type Permission = ReturnType<typeof reconstructPermissions>[number]

export interface Preset {
  permissions: Permission[]
  apiInfo: OpenApiObject["info"]
  serverUrl: string
  path: string
  query: string
  pathPattern: string
  operation: OpenApiOperation
}
