import { BigNumberish, ParamType } from "ethers"
import { Operator, ParameterType } from "../../../types"

import { abiEncode } from "../../../abiEncode"
import { encodeKey } from "../../../keys"

import { ConditionFunction } from "../types"

/**
 * Meters the parameter against an allowance.
 *
 * @param allowanceKey The allowance's key, as a label or already encoded
 */
export const withinAllowance =
  (allowanceKey: string): ConditionFunction<BigNumberish> =>
  (abiType: ParamType) => {
    const type = ParamType.from(abiType)
    if (!type.type.startsWith("uint")) {
      throw new Error("`withinAllowance` is only supported for uint params")
    }
    return {
      paramType: ParameterType.Static,
      operator: Operator.WithinAllowance,
      compValue: abiEncode(["bytes32"], [encodeKey(allowanceKey)]),
    }
  }
