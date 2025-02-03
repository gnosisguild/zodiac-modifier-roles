export * from "zodiac-roles-deployments"

export {
  c,
  forAll,
  processPermissions,
  reconstructPermissions,
  coercePermission,
  targetId,
  permissionId,
} from "./permissions"
export type {
  Permission,
  PermissionCoerced,
  TargetPermission,
  FunctionPermission,
  FunctionPermissionCoerced,
  PermissionSet,
} from "./permissions"

export { checkIntegrity, splitTargets } from "./targets"
export { applyAnnotations } from "./annotations"

export { encodeKey, decodeKey } from "./keys"

// TODO those will be thrown out, too
export { setUpRoles, setUpRolesMod } from "./setup"

export { planApply, planApplyRole, planExtendRole } from "./entrypoints/plan"

export { postRole } from "./api"
export { posterAbi, rolesAbi } from "./abi"

export { ethSdkConfig } from "./ethSdk"
