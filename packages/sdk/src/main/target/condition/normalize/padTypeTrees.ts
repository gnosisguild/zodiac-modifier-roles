import { Condition, Operator, ParameterType } from "zodiac-roles-deployments"

export function padTypeTree(condition: Condition): Condition {
  const complexBranches = collectComplexBranches(condition)

  // find the longest branch
  let maxLength = 0
  let longestBranch: Condition | null = null
  for (const branch of complexBranches) {
    if (branch.children?.length && branch.children.length > maxLength) {
      maxLength = branch.children.length
      longestBranch = branch
    }
  }
  if (!longestBranch) return condition

  // fill up shorter branches with Pass nodes
  for (const branch of complexBranches) {
    if (!branch.children) continue
    for (let i = branch.children?.length; i < maxLength; i++) {
      branch.children = [
        ...branch.children,
        copyStructure(longestBranch.children![i]),
      ]
    }
  }
  return condition
}

/**
 * Traverses through logical and array nodes the condition tree and collects all complex branches: tuple, abiEncoded, calldata nodes
 */
const collectComplexBranches = (condition: Condition): Condition[] => {
  if (
    condition.operator === Operator.And ||
    condition.operator === Operator.Or ||
    condition.operator === Operator.Nor
  ) {
    return condition.children?.flatMap(collectComplexBranches) ?? []
  }

  if (condition.paramType === ParameterType.Array) {
    return condition.children?.flatMap(collectComplexBranches) ?? []
  }

  if (
    condition.paramType === ParameterType.AbiEncoded ||
    condition.paramType === ParameterType.Calldata ||
    condition.paramType === ParameterType.Tuple
  ) {
    return [condition]
  }

  return []
}

/**
 * Given a condition, returns a tree of Pass nodes that matches the structure of the type
 */
const copyStructure = (condition: Condition): Condition => {
  // skip over logical conditions
  if (condition.paramType === ParameterType.None) {
    if (!condition.children || condition.children.length === 0) {
      throw new Error("Logical condition must have at least one child")
    }
    return copyStructure(condition.children[0])
  }

  // handle array conditions
  if (condition.paramType === ParameterType.Array) {
    if (!condition.children || condition.children.length === 0) {
      throw new Error("Array condition must have at least one child")
    }
    return {
      paramType: ParameterType.Array,
      operator: Operator.Pass,
      children: [copyStructure(condition.children[0])],
    }
  }

  return {
    paramType: condition.paramType,
    operator: Operator.Pass,
    children: condition.children?.map(copyStructure),
  }
}
