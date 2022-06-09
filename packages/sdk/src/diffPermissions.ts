import {
  Clearance,
  RolePermissions,
  Target,
  Function,
  Parameter,
} from "./types"

// Returns permissions granted by a that are not granted but b
const diffPermissions = (
  a: RolePermissions,
  b: RolePermissions
): RolePermissions => {
  // targets in a that are not in b
  const targetDiff = a.targets.filter(
    (targetA) => !b.targets.some((targetB) => targetsEqual(targetA, targetB))
  )

  // targets that are function-cleared in a and in b
  const functionClearedOverlap = a.targets.filter(
    (targetA) =>
      targetA.clearance === Clearance.Function &&
      b.targets.some((targetB) => targetsEqual(targetA, targetB))
  )

  // diff the functions of targets in the overlap
  const functionClearedOverlapDiff = functionClearedOverlap
    .map((targetA) => {
      const targetB = b.targets.find((targetB) =>
        targetsEqual(targetA, targetB)
      )
      if (!targetB) throw new Error("invariant violation")
      return diffFunctionClearedTargets(targetA, targetB)
    })
    .filter(isTruthy)

  return {
    targets: [...targetDiff, ...functionClearedOverlapDiff],
  }
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

  const functionDiff = targetA.functions.filter(
    (functionA) =>
      !targetB.functions.some((functionB) =>
        functionsEqual(functionA, functionB)
      )
  )

  // functions that are scoped in targetA and targetB
  const scopedFunctionOverlap = targetA.functions.filter(
    (functionA) =>
      !functionA.wildcarded &&
      targetB.functions.some((functionB) =>
        functionsEqual(functionA, functionB)
      )
  )

  // diff the parameters of functions in the overlap
  const scopedFunctionOverlapDiff = scopedFunctionOverlap
    .map((functionA) => {
      const functionB = targetB.functions.find((functionB) =>
        functionsEqual(functionA, functionB)
      )
      if (!functionB) throw new Error("invariant violation")
      return diffScopedFunctions(functionA, functionB)
    })
    .filter(isTruthy)

  const functions = [...functionDiff, ...scopedFunctionOverlapDiff]

  // if the function diff is empty, we treat the targets as equal
  if (functions.length === 0) return undefined

  return {
    ...targetA,
    functions,
  }
}

// Returns a diff of function, and undefined if the functions are equal
const diffScopedFunctions = (
  functionA: Function,
  functionB: Function
): Function | undefined => {
  // need to return early if parameters are empty, so we don't handle this as an empty diff
  if (functionA.parameters.length === 0 && functionB.parameters.length > 0) {
    return functionA
  }

  const parameterDiff = functionA.parameters.filter(
    (paramA) =>
      !functionB.parameters.some((paramB) => paramsEqual(paramA, paramB))
  )

  // parameter diff is empty, so the functions are equal
  if (parameterDiff.length === 0) return undefined

  return {
    ...functionA,
    parameters: parameterDiff,
  }
}

const targetsEqual = (targetA: Target, targetB: Target) =>
  targetA.address === targetB.address &&
  targetA.clearance === targetB.clearance &&
  targetA.executionOptions === targetB.executionOptions

const functionsEqual = (functionA: Function, functionB: Function) =>
  functionA.sighash === functionB.sighash &&
  functionA.wildcarded === functionB.wildcarded &&
  functionA.executionOptions === functionB.executionOptions

const paramsEqual = (paramA: Parameter, paramB: Parameter) =>
  paramA.index === paramB.index &&
  paramA.type === paramB.type &&
  paramA.comparison === paramB.comparison &&
  arraysEqual(paramA.comparisonValue, paramB.comparisonValue)

const arraysEqual = (a: string[], b: string[]) =>
  a.length === b.length && a.every((item) => b.includes(item))

const isTruthy = Boolean as any as <T>(x: T | undefined) => x is T
