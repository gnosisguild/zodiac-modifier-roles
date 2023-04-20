import { BigNumberish } from "ethers"
import { defaultAbiCoder, ParamType } from "ethers/lib/utils"

import { Operator, ParameterType } from "../../../types"

import { ConditionFunction } from "./types"

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
      compValue: defaultAbiCoder.encode(["bytes32"], [allowanceKey]),
    }
  }
