import { Condition } from "../types"

// TODO - this is a placeholder for the normalizeCondition function, it should:
// - flatten nested AND conditions
// - flatten nested OR conditions
// - remove redundant conditions (empty AND/OR, trailing PASS conditions)
// - enforce a canonical order for children (e.g. AND/OR conditions should be sorted by their hash)
// -
export const normalizeCondition = (condition: Condition) => {
  return condition
}
