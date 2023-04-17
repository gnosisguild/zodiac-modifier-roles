import { Condition } from "../types"

// TODO - this is a placeholder for the normalizeCondition function, it should:
// - flatten nested AND conditions
// - flatten nested OR conditions
// - remove redundant conditions (empty AND/OR, trailing PASS conditions?)
// - prune equal branches in logical expressions
// - enforce a canonical order for children (e.g. AND/OR conditions should be sorted by their hash)
// - maybe: bool formula minimization, for example move OR conditions as far down as possible, e.g.: or(and(a, b), and(a, c)) -> and(a, or(b, c))
export const normalizeCondition = (condition: Condition) => {
  return condition
}
