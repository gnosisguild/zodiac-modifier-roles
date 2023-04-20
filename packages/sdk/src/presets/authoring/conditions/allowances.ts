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

export const callWithinAllowance =
  (allowanceKey: string): ConditionFunction<any> =>
  () => {
    return {
      paramType: ParameterType.None,
      operator: Operator.CallWithinAllowance,
      compValue: defaultAbiCoder.encode(["bytes32"], [allowanceKey]),
    }
  }

export const etherWithinAllowance =
  (allowanceKey: string): ConditionFunction<any> =>
  () => {
    return {
      paramType: ParameterType.None,
      operator: Operator.EtherWithinAllowance,
      compValue: defaultAbiCoder.encode(["bytes32"], [allowanceKey]),
    }
  }
