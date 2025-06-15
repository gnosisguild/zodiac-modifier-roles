import {
  Annotation,
  Clearance,
  ExecutionOptions,
  Target,
} from "zodiac-roles-deployments"

import { groupBy } from "../groupBy"
import { normalizeConditionNext as normalizeCondition } from "../target/condition"
import { coercePermission } from "./coercePermission"
import { executionFlagsToOptions } from "./executionFlagsToOptions"
import { mergePermissions } from "./mergePermissions"

import { Permission, PermissionSet } from "./types"

/**
 * Processes permissions returning the resulting list of allowed targets. Merges permission entries addressing the same function and performs sanity checks.
 * @param permissions to process
 * @returns The resulting list of allowed targets
 */
export const processPermissions = (
  input: readonly (Permission | PermissionSet)[]
): { targets: Target[]; annotations: Annotation[] } => {
  const permissions = input.flat().map(coercePermission)

  const {
    permissions: mergedPermissions,
    warnings,
    violations,
  } = mergePermissions(permissions)

  throwViolations(violations)
  showWarnings(warnings)

  const permissionsAllowed = mergedPermissions.filter(
    (entry) => !("selector" in entry)
  )
  const permissionsScoped = mergedPermissions.filter(
    (entry) => "selector" in entry
  )

  const targetsAllowed = permissionsAllowed.map((permission) => ({
    address: permission.targetAddress.toLowerCase() as `0x${string}`,
    clearance: Clearance.Target,
    executionOptions: executionFlagsToOptions(permission),
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
      executionOptions: executionFlagsToOptions(rest),
      wildcarded: !condition,
      condition: condition && normalizeCondition(condition),
    })),
  }))

  // collect all annotations
  const annotations = input
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

function throwViolations(violations: string[]) {
  if (violations.length) {
    throw new Error(`Invalid Permissions:\n` + violations.join("\n\t"))
  }
}

function showWarnings(warnings: string[]) {
  for (const warning of warnings) {
    console.warn(warning)
  }
}
