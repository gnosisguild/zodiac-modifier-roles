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
export type { Permission, StatedPermission, PermissionSet } from "./permissions"

export {
  applyTargets,
  checkIntegrity,
  diffTargets,
  splitTargets,
} from "./targets"
export { applyAnnotations } from "./annotations"
export { applyMembers } from "./members"
export { applyAllowances } from "./allowances"

export { encodeKey, decodeKey } from "./keys"

// TODO those will be thrown out, too
export { setUpRoles, setUpRolesMod } from "./setup"

export { postRole } from "./api"
export { posterAbi, rolesAbi } from "./abi"

export { ethSdkConfig } from "./ethSdk"
