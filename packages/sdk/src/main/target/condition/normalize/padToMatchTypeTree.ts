import { Condition, Operator } from "zodiac-roles-deployments"
import {
  createTypeTree,
  isArray,
  isComplex,
  isLogical,
  TypeTree,
  typeTreeId,
} from "../typeTree"

export function padToMatchTypeTree(condition: Condition): Condition {
  /*
   * This function is to be used from within normalizeCondition we operate
   * under the assumption that lower levels were recursively normalized thus we
   * only really wanna kick off the normalization for Logical or Array nodes
   */
  if (!isLogical(condition) && !isArray(condition)) {
    return condition
  }

  const isPaddeable = (c: Condition) => isLogical(c) || isComplex(c)

  const typeTreeIds = new Set(
    (condition.children || [])
      .filter(isPaddeable)
      .map((child) => typeTreeId(child))
  )

  // All paddeable children already match
  if (typeTreeIds.size <= 1) {
    return condition
  }

  /*
   *
   * Apply all nodes onto eachother, cumulatively
   *
   * Since type trees can vary in structure at different depths, no single tree
   * is "longest" everywhere. Tree A might have more nodes in one subtree while
   * Tree B has more in another. Padding each child with the structure from
   * all others, we ensure uniform structure across all branches, because
   * padding is cumulative
   */
  const nextChildren = [...condition.children!]
  for (let i = 0; i < condition.children!.length; i++) {
    if (!isPaddeable(nextChildren[i])) continue

    for (let j = 0; j < nextChildren.length; j++) {
      if (j == i || !isPaddeable(nextChildren[j])) continue

      nextChildren[i] = extendWithPassNodes(
        nextChildren[i],
        createTypeTree(nextChildren[j])!
      )
    }
  }

  return {
    ...condition,
    children: nextChildren,
  }
}

/*
 * Pads a `condition` Pass nodes, such that it structurally matches a typeTree
 *
 * Assumptions:
 * - `condition` and `typeTree` are structurally compatible (not checked here).
 * - Either may be a subset of the other.
 * - If `condition` is missing branches that exist in `typeTree`, they are added.
 * - If `condition` is wider (has extra nodes), they are preserved — nothing is removed.
 *
 */
function extendWithPassNodes(
  condition: Condition | undefined | null,
  typeTree: TypeTree
): Condition {
  if (!condition) {
    condition = {
      operator: Operator.Pass,
      paramType: typeTree.paramType,
    }
  }

  if (isLogical(condition)) {
    return {
      ...condition,
      children: condition.children!.map((child) =>
        extendWithPassNodes(child, typeTree)
      ),
    }
  }

  if (isComplex(condition)) {
    const children = (condition.children || []) as Condition[]

    /*
     * Merge the padded children with the original children array.
     * - If condition has fewer children than typeTree: extends with padded nodes
     * - If condition has more children than typeTree: preserves extra nodes at the end
     * - Overlapping positions: recursively pad existing nodes with typeTree structure
     */
    return {
      ...condition,
      children: mergeArrays(
        children,
        typeTree.children.map((childTypeTree, index) =>
          extendWithPassNodes(children[index], childTypeTree)
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
