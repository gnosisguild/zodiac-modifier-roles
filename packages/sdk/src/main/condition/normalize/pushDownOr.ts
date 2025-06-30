import { Condition, Operator, ParameterType } from "zodiac-roles-deployments"

import { conditionId } from "../conditionId"

/** push AND and OR conditions as far down the tree as possible without changing semantics */
export function pushDownOr(
  condition: Condition,
  normalize: (c: Condition) => Condition = (c) => c
): Condition {
  if (condition.operator !== Operator.Or) {
    return condition
  }

  // we should at least have two branches since this function runs after `unwrapSingleBranches()`
  if (!condition.children?.length || condition.children.length === 1) {
    throw new Error("invariant violation")
  }

  // bail on mixed expression types
  if (
    condition.children.some(({ operator }) => operator !== Operator.Matches)
  ) {
    return condition
  }

  // bail on Arrays, only  Tuple/Calldata/AbiEncoded Matches
  if (
    condition.children.some((child) => child.paramType == ParameterType.Array)
  ) {
    return condition
  }

  const hingeIndex = findMatchesHingeIndex(condition.children)
  if (hingeIndex === null) {
    return condition
  }

  const [first] = condition.children

  const children = first.children!.map((child, i) =>
    i !== hingeIndex
      ? child
      : {
          paramType: ParameterType.None,
          operator: Operator.Or,
          children: condition.children!.map((c) => c.children?.[i]),
        }
  ) as Condition[]

  return normalize({
    ...first,
    children: children,
  })
}

/**
 * Given a set of MATCHES conditions, check that their children are equal beyond a single hinge node.
 * @returns the index of the hinge node. If there are differences in more than a single index, returns `null`.
 * @throws If the conditions would not pass integrity checks.
 **/
const findMatchesHingeIndex = (conditions: readonly Condition[]) => {
  // use first branch as reference and check if the others are equivalent beyond a single nested hinge node
  let hingeNodeIndex: number | null = null

  const [first, ...others] = conditions

  // empty matches does not make sense and would be rejected by the integrity check, bail
  if (!first.children?.length) throw new Error("empty children")

  // all expressions must only differ in one child, the hinge node
  for (const other of others) {
    // empty matches does not make sense and would be rejected by the integrity check, bail
    if (!other.children?.length) throw new Error("empty children")

    for (
      let i = 0;
      i < Math.max(first.children.length, other.children.length);
      i++
    ) {
      if (conditionsEqual(first.children[i], other.children[i])) {
        continue
      }

      if (hingeNodeIndex === null) {
        hingeNodeIndex = i
      }

      if (hingeNodeIndex !== i) {
        // difference in more than matches child
        return null
      }
    }
  }

  return hingeNodeIndex
}

const conditionsEqual = (a: Condition | undefined, b: Condition | undefined) =>
  (!a || conditionId(a)) === (!b || conditionId(b))
