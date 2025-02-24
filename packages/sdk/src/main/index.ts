export * from "zodiac-roles-deployments"

export type {
  Permission,
  PermissionCoerced,
  TargetPermission,
  FunctionPermission,
  FunctionPermissionCoerced,
  PermissionSet,
  ExecutionFlags,
} from "./permissions"

export {
  processPermissions,
  reconstructPermissions,
  coercePermission,
  validatePresets,
  targetId,
  permissionId,
} from "./permissions"

/*
 *
 * Layer 1 - Target
 *
 */
export { c, forAll } from "./target/authoring"
export { planApply, planApplyRole, planExtendRole } from "./target/plan"

/*
 *
 * Misc
 *
 */
export { encodeKey, decodeKey } from "./keys"
export { postRole } from "./postRole"
