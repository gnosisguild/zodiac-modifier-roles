import { Condition, Operator } from "../types"

// TODO - this is a placeholder for the normalizeCondition function, it should:
// - flatten nested AND/OR conditions
// - remove redundant conditions (single child AND/OR, trailing PASS conditions?)
// - prune equal branches in logical expressions
// - enforce a canonical order for children (e.g. AND/OR conditions should be sorted by their hash)
// - maybe: bool formula minimization, for example move OR conditions as far down as possible, e.g.: or(and(a, b), and(a, c)) -> and(a, or(b, c))
export const normalizeCondition = (condition: Condition) => {
  let result = condition
  result = flattenNestedLogicalConditions(result)
  return result
}

/** flatten nested AND/OR conditions */
const flattenNestedLogicalConditions = (condition: Condition): Condition => {
  const children = condition.children?.map(flattenNestedLogicalConditions)

  if (
    condition.operator === Operator.And ||
    condition.operator === Operator.Or
  ) {
    return {
      ...condition,
      children: (children || []).flatMap((child) =>
        child.operator === condition.operator ? child.children || [] : [child]
      ),
    }
  }

  return children ? { ...condition, children } : condition
}
