import { normalizeCondition } from "../conditions"
import { Annotation, Clearance, ExecutionOptions, Target } from "../types"
import { groupBy } from "../utils/groupBy"

import { mergeFunctionPermissions } from "./mergeFunctionPermissions"
import {
  FunctionPermissionCoerced,
  Permission,
  PermissionCoerced,
  PermissionSet,
} from "./types"
import { execOptions, targetId, isFunctionScoped } from "./utils"

/**
 * Processes permissions returning the resulting list of allowed targets. Merges permission entries addressing the same function and performs sanity checks.
 * @param permissions to process
 * @returns The resulting list of allowed targets
 */
export const processPermissions = (
  permissions: readonly (Permission | PermissionSet)[]
): { targets: Target[]; annotations: Annotation[] } => {
  const flatPermissions = permissions.flat()

  // first we merge permissions addressing the same target functions so every entry will be unique
  const uniquePermissions = mergeFunctionPermissions(flatPermissions)
  sanityCheck(uniquePermissions)

  // collect all fully cleared targets
  const fullyClearedTargets = uniquePermissions
    .filter((entry) => !isFunctionScoped(entry))
    .map((entry) => ({
      address: entry.targetAddress.toLowerCase() as `0x${string}`,
      clearance: Clearance.Target,
      executionOptions: execOptions(entry),
      functions: [],
    }))

  // collect all function scoped targets and bring conditions into the normal form
  const functionPermissions = uniquePermissions.filter(
    (entry) => "selector" in entry
  ) as FunctionPermissionCoerced[]
  const functionScopedTargets = Object.entries(
    groupBy(functionPermissions, (entry) => entry.targetAddress)
  ).map(([targetAddress, allowFunctions]) => ({
    address: targetAddress.toLowerCase() as `0x${string}`,
    clearance: Clearance.Function,
    executionOptions: ExecutionOptions.None,
    functions: allowFunctions.map((allowFunction) => {
      const { condition } = allowFunction
      return {
        selector: allowFunction.selector,
        executionOptions: execOptions(allowFunction),
        wildcarded: !condition,
        condition: condition && normalizeCondition(condition),
      }
    }),
  }))

  // collect all annotations
  const annotations = permissions
    .filter(isPermissionSet)
    .map((permissionSet) => permissionSet.annotation)
    .filter((annotation): annotation is Annotation => !!annotation)

  return {
    targets: [...fullyClearedTargets, ...functionScopedTargets],

    // make annotations unique
    annotations: annotations.filter(
      (annotation, i) =>
        annotations.findIndex((a) => a.uri === annotation.uri) === i
    ),
  }
}

const sanityCheck = (permissions: PermissionCoerced[]) => {
  assertNoWildcardScopedIntersection(permissions)
  assertNoDuplicateAllowFunction(permissions)
}

const assertNoWildcardScopedIntersection = (
  permissions: PermissionCoerced[]
) => {
  const wildcardTargets = permissions
    .filter((entry) => !isFunctionScoped(entry))
    .map((entry) => entry.targetAddress)

  const scopedTargets = new Set(
    permissions.filter(isFunctionScoped).map((entry) => entry.targetAddress)
  )

  const intersection = [
    ...new Set(wildcardTargets.filter((x) => scopedTargets.has(x))),
  ]
  if (intersection.length > 0) {
    throw new Error(
      `An address can either be fully allowed or scoped to selected functions. The following addresses are both: ${intersection.join(
        ", "
      )}`
    )
  }
}

const assertNoDuplicateAllowFunction = (permissions: PermissionCoerced[]) => {
  const allowFunctions = permissions.filter(isFunctionScoped).map(targetId)

  const counts = allowFunctions.reduce(
    (result, item) => ({ ...result, [item]: (result[item] || 0) + 1 }),
    {} as Record<string, number>
  )
  const duplicates = [
    ...new Set(allowFunctions.filter((item) => counts[item] > 1)),
  ]

  if (duplicates.length > 0) {
    throw new Error(
      `The following functions appear multiple times and cannot be merged: ${duplicates.join(
        ", "
      )}.\nThis might be be due to different \`send\` and \`delegatecall\` flags in entries with the same target.`
    )
  }
}

const isPermissionSet = (p: Permission | PermissionSet): p is PermissionSet =>
  Array.isArray(p)
