import { Clearance, Target, Function, Parameter } from "./types"

/**
 *  Returns permissions granted by a that are not granted by b
 */
const diffPermissions = (a: Target[], b: Target[]): Target[] => {
  // targets in a that are not in b
  const targetsDiff = a.filter(
    (targetA) => !b.some((targetB) => targetsEqual(targetA, targetB))
  )

  // targets that are function-cleared in a and in b
  const functionClearedOverlap = a.filter(
    (targetA) =>
      targetA.clearance === Clearance.Function &&
      b.some((targetB) => targetsEqual(targetA, targetB))
  )

  // diff the functions of targets in the overlap
  const functionClearedOverlapDiff = functionClearedOverlap
    .map((targetA) => {
      const targetB = b.find((targetB) => targetsEqual(targetA, targetB))
      if (!targetB) throw new Error("invariant violation")
      return diffFunctionClearedTargets(targetA, targetB)
    })
    .filter(isTruthy)

  return [...targetsDiff, ...functionClearedOverlapDiff]
}

export default diffPermissions

// Returns a diff of function-cleared targets, and undefined if the targets are equal
const diffFunctionClearedTargets = (
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
  functionA.parameters.every((paramA) =>
    functionB.parameters.some((paramB) => paramsEqual(paramA, paramB))
  ) &&
  functionB.parameters.every((paramB) =>
    functionA.parameters.some((paramA) => paramsEqual(paramA, paramB))
  )

const paramsEqual = (paramA: Parameter, paramB: Parameter) =>
  paramA.index === paramB.index &&
  paramA.type === paramB.type &&
  paramA.comparison === paramB.comparison &&
  arraysEqual(paramA.comparisonValue, paramB.comparisonValue)

const arraysEqual = (a: string[], b: string[]) =>
  a.length === b.length && a.every((item) => b.includes(item))

const isTruthy = Boolean as any as <T>(x: T | undefined) => x is T
