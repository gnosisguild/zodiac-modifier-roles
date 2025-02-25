export * from "zodiac-roles-deployments"

/*
 *
 * Layer 1 - Target
 *
 */
export { c, forAll } from "./target/authoring"
export { planApply, planApplyRole, planExtendRole } from "./target/plan"
export { targetIntegrity } from "./target/integrity"

/*
 *
 * Layer 2 - Permission
 *
 */
export type {
  Permission,
  PermissionCoerced,
  TargetPermission,
  FunctionPermission,
  FunctionPermissionCoerced,
  PermissionSet,
  ExecutionFlags,
} from "./permission"

export {
  permissionId,
  processPermissions,
  reconstructPermissions,
  targetId,
  validatePresets,
} from "./permission"

/*
 *
 * Misc
 *
 */
export { default as abi } from "../abi.json"
export { encodeKey, decodeKey } from "./keys"
export { postRole } from "./postRole"
