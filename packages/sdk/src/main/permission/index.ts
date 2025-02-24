export { processPermissions } from "./processPermissions"
export { mergePermissions } from "./mergePermissions"
export { reconstructPermissions } from "./reconstructPermissions"
export { validatePresets } from "./validatePresets"
export { targetId, permissionId } from "./utils"

export type {
  Permission,
  PermissionSet,
  PermissionCoerced,
  TargetPermission,
  FunctionPermission,
  FunctionPermissionCoerced,
  ExecutionFlags,
} from "./types"
