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
export { encodeSignTypedMessage, scopeSignTypedMessage } from "./eip712-signer"
export { encodeKey, decodeKey } from "./keys"
export { postRole } from "./postRole"

/*
 *
 * Integration? TODO fix
 *
 */
import {
  encodeTypedDomain,
  encodeTypedMessage,
  toAbiTypes,
} from "./eip712-signer/encode"

export const __integration = {
  encodeTypedDomain,
  encodeTypedMessage,
  toAbiTypes,
}
