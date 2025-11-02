export * from "zodiac-roles-deployments"

/*
 *
 * Layer 1 - Target
 *
 */
export { c, forAll } from "./target/authoring"
export { planApply, planApplyRole, planExtendRole } from "./target/plan"
export { targetIntegrity } from "./target/integrity"

// helpers
export { callsPlannedForApply, callsPlannedForApplyRole } from "./target/plan"
export { encodeCalls, type Call } from "./target/calls"

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
  coercePermission,
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
export { rolesAbi, posterAbi } from "./abi"
export { encodeSignTypedMessage, scopeSignTypedMessage } from "./eip712-signer"
export { encodeKey, decodeKey } from "./keys"
export { postRole } from "./postRole"
export { fetchLicense, License, LicenseError } from "./licensing"

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

import { typesForDomain } from "./eip712-signer/types"

export const __integration = {
  encodeTypedDomain,
  encodeTypedMessage,
  toAbiTypes,
  typesForDomain,
}
