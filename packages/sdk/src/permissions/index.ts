export * from "./authoring"
export { processPermissions } from "./processPermissions"
export { reconstructPermissions } from "./reconstructPermissions"
export { validatePresets } from "./validatePresets"
export { coercePermission, targetId, permissionId } from "./utils"

export type {
  Permission,
  PermissionSet,
  PermissionCoerced,
  TargetPermission,
  FunctionPermission,
  FunctionPermissionCoerced,
} from "./types"

export type { Scoping } from "./authoring/conditions/types"
