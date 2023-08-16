import type { reconstructPermissions } from "zodiac-roles-sdk"
import { OpenApiObject, OpenApiOperation } from "./schema"

export type Permission = ReturnType<typeof reconstructPermissions>[number]

export interface ResolvedAnnotation {
  permissions: Permission[]
  apiInfo: OpenApiObject["info"]
  server: string
  path: string
  operation: OpenApiOperation
}
