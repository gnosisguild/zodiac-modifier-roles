import { BigNumberish, ParamType } from "ethers"
import { Operator, ParameterType } from "zodiac-roles-deployments"

import { abiEncode } from "../../../abiEncode"

import { ConditionFunction } from "../types"

export const withinAllowance =
  (allowanceKey: `0x${string}`): ConditionFunction<BigNumberish> =>
  (abiType: ParamType) => {
    const type = ParamType.from(abiType)
    if (!type.type.startsWith("uint")) {
      throw new Error("`withinAllowance` is only supported for uint params")
    }
    return {
      paramType: ParameterType.Static,
      operator: Operator.WithinAllowance,
      compValue: abiEncode(["bytes32"], [allowanceKey]),
    }
  }
