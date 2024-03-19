import { conditionId, normalizeCondition } from "../conditions"
import { Clearance, Target, Function, Condition } from "../types"

/**
 *  Returns targets granted by `a` that are not granted by `b`
 */
export const diffTargets = (
  a: readonly Target[],
  b: readonly Target[]
): Target[] => {
  // targets in a that are not in b
  const targetsDiff = a.filter(
    (targetA) => !b.some((targetB) => targetsEqual(targetA, targetB))
  )

  // targets that are scoped in a and in b
  const scopedTargetsOverlap = a.filter(
    (targetA) =>
      targetA.clearance === Clearance.Function &&
      b.some((targetB) => targetsEqual(targetA, targetB))
  )

  // diff the functions of targets in the overlap
  const scopedTargetsOverlapDiff = scopedTargetsOverlap
    .map((targetA) => {
      const targetB = b.find((targetB) => targetsEqual(targetA, targetB))
      if (!targetB) throw new Error("invariant violation")
      return diffScopedTargets(targetA, targetB)
    })
    .filter(isTruthy)

  return [...targetsDiff, ...scopedTargetsOverlapDiff]
}

// Returns a diff of function-scoped targets, and undefined if the targets are equal
const diffScopedTargets = (
  targetA: Target,
  targetB: Target
): Target | undefined => {
  // need to return early if functions are empty, so we don't handle this as an empty diff
  if (targetA.functions.length === 0 && targetB.functions.length > 0) {
    return targetA
  }

  const functionsDiff = targetA.functions.filter(
    (functionA) =>
      !targetB.functions.some((functionB) =>
        functionsEqual(functionA, functionB)
      )
  )

  // if the functions diff is empty, we treat the targets as equal
  if (functionsDiff.length === 0) return undefined

  return {
    ...targetA,
    functions: functionsDiff,
  }
}

const targetsEqual = (targetA: Target, targetB: Target) =>
  targetA.address.toLowerCase() === targetB.address.toLowerCase() &&
  targetA.clearance === targetB.clearance &&
  targetA.executionOptions === targetB.executionOptions

const functionsEqual = (functionA: Function, functionB: Function) =>
  functionA.selector === functionB.selector &&
  functionA.wildcarded === functionB.wildcarded &&
  functionA.executionOptions === functionB.executionOptions &&
  conditionsEqual(functionA.condition, functionB.condition)

const conditionsEqual = (conditionA?: Condition, conditionB?: Condition) =>
  conditionA === conditionB ||
  (!conditionA && !conditionB) ||
  (conditionA &&
    conditionB &&
    conditionId(normalizeCondition(conditionA)) ===
      conditionId(normalizeCondition(conditionB)))

const isTruthy = Boolean as any as <T>(x: T | undefined) => x is T
