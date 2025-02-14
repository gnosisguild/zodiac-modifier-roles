import {
  Annotation,
  Clearance,
  ExecutionOptions,
  Target,
} from "zodiac-roles-deployments"

import { normalizeCondition } from "../conditions"
import { mergePermissions } from "./mergePermissions"

import { groupBy } from "../utils/groupBy"
import { coercePermission, execOptions } from "./utils"

import { Permission, PermissionSet } from "./types"

/**
 * Processes permissions returning the resulting list of allowed targets. Merges permission entries addressing the same function and performs sanity checks.
 * @param permissions to process
 * @returns The resulting list of allowed targets
 */
export const processPermissions = (
  permissions: readonly (Permission | PermissionSet)[]
): { targets: Target[]; annotations: Annotation[] } => {
  // first we merge permissions addressing the same target functions so every entry will be unique
  const mergedPermissions = mergePermissions(
    permissions.flat().map(coercePermission)
  )

  const permissionsAllowed = mergedPermissions.filter(
    (entry) => !("selector" in entry)
  )
  const permissionsScoped = mergedPermissions.filter(
    (entry) => "selector" in entry
  )

  const targetsAllowed = permissionsAllowed.map((permission) => ({
    address: permission.targetAddress.toLowerCase() as `0x${string}`,
    clearance: Clearance.Target,
    executionOptions: execOptions(permission),
    functions: [],
  }))

  const targetsScoped = Object.entries(
    groupBy(permissionsScoped, (entry) => entry.targetAddress)
  ).map(([targetAddress, permissions]) => ({
    address: targetAddress.toLowerCase() as `0x${string}`,
    clearance: Clearance.Function,
    executionOptions: ExecutionOptions.None,
    functions: permissions.map(({ selector, condition, ...rest }) => ({
      selector,
      executionOptions: execOptions(rest),
      wildcarded: !condition,
      condition: condition && normalizeCondition(condition),
    })),
  }))

  // collect all annotations
  const annotations = permissions
    .filter((p) => Array.isArray(p))
    .map((permissionSet) => permissionSet.annotation)
    .filter((annotation): annotation is Annotation => !!annotation)

  return {
    targets: [...targetsAllowed, ...targetsScoped],

    // make annotations unique
    annotations: annotations.filter(
      (annotation, i) =>
        annotations.findIndex((a) => a.uri === annotation.uri) === i
    ),
  }
}
