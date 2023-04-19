import { Condition } from "../types"

// TODO - this is a placeholder for the sanitizeCondition function, it should:
// - perform some checks from Integrity.sol
// - check that the root condition uses ParameterType.AbiEncoded / ParameterType.None
// - check that there are no empty AND/OR/NOR conditions
// - check that the children and compValue of each condition are consistent with the operator
// - check that the total number of condition nodes is max 256
export const checkConditionIntegrity = (condition: Condition): void => {}
