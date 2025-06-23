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
   * This function is to be used from within normalizeCondition
   * we operate under the assumption that lower levels were recursively normalized
   * thus we only really wanna kick off the normlization for Logical/Array nodes
   */
  if (!isLogical(condition) && !isArray(condition)) {
    return condition
  }

  const isPaddeable = (c: Condition) => isLogical(c) || isComplex(c)

  const uniqueTypeTreeIds = new Set(
    (condition.children || [])
      .filter(isPaddeable)
      .map((child) => typeTreeId(child))
  )

  // All paddeable children already match
  if (uniqueTypeTreeIds.size <= 1) {
    return condition
  }

  const nextChildren = [...condition.children!]
  for (let i = 0; i < condition.children!.length; i++) {
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

/*
 * Pads a `condition` tree so it structurally matches a given `typeTree`.
 *
 * Assumptions:
 * - `condition` and `typeTree` are structurally compatible (not enforced here).
 * - Either may be a subset of the other.
 * - If `condition` is missing branches that exist in `typeTree`, they are added.
 * - If `condition` is wider (has extra nodes), they are preserved — nothing is removed.
 *
 */
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

  // Ensure condition has at least one child if it's expected to
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

    /*
     * Use mergeArrays to preserve any extra nodes in `condition` (if it's wider),
     * while padding or replacing only the overlapping portion with typeTree.
     */
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
