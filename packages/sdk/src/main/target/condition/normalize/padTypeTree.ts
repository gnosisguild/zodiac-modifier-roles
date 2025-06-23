import { Condition, Operator } from "zodiac-roles-deployments"
import {
  createTypeTree,
  isArray,
  isComplex,
  isLogical,
  TypeTree,
  typeTreeId,
} from "../typeTree"

export function padTypeTree(condition: Condition): Condition {
  /*
   * This function is to be used only from within normalizeCondition
   * there we come from the assumption that lower levels were recursively normalized
   * thus we only really wanna kick off the normlization at Logical or Array nodes
   */
  if (!isLogical(condition) && !isArray(condition)) {
    return condition
  }

  const isPaddeable = (c: Condition) => isLogical(c) || isComplex(c)

  const ids = new Set()
  for (const child of condition.children || []) {
    if (isPaddeable(child)) {
      ids.add(typeTreeId(child))
    }
  }

  // there's a unique type tree among children, nothing to do
  if (ids.size <= 1) {
    return condition
  }

  const nextChildren = [...condition.children!]
  for (let i = 0; i < nextChildren.length; i++) {
    if (!isPaddeable(nextChildren[i])) continue

    for (let j = 0; j < nextChildren.length; j++) {
      if (j == i || !isPaddeable(nextChildren[j])) continue

      nextChildren[i] = pad(nextChildren[i], createTypeTree(nextChildren[j])!)
    }
  }

  return {
    ...condition,
    children: nextChildren,
  }
}

function pad(
  condition: Condition | undefined | null,
  typeTree: TypeTree
): Condition {
  if (!condition) {
    condition = {
      operator: Operator.Pass,
      paramType: typeTree.paramType,
      ...(isComplex(typeTree)
        ? { children: typeTree.children.map((child) => pad(null, child)) }
        : {}),
    }
  }

  const atLeastOne = (): Condition[] => {
    if (!condition.children || condition.children.length == 0) {
      throw new Error("Expected populated children array")
    }

    return condition.children! as Condition[]
  }

  if (isLogical(condition)) {
    const children = atLeastOne()
    return {
      ...condition,
      children: children.map((child) => pad(child, typeTree)),
    }
  }

  if (isComplex(condition)) {
    const children = atLeastOne()

    return {
      ...condition,
      children: mergeArrays(
        children,
        typeTree.children.map((childTypeTree, index) =>
          pad(children[index], childTypeTree)
        )
      ),
    }
  }

  return condition
}

function mergeArrays<T>(a: T[], b: T[]): T[] {
  if (a.length <= b.length) return b

  return [...b, ...a.slice(b.length)]
}
