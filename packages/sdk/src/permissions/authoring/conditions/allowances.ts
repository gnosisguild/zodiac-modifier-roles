import { BigNumberish } from "ethers"
import { ParamType } from "ethers/lib/utils"

import { Operator, ParameterType } from "../../../types"
import { encodeAbiParameters } from "../../../utils/encodeAbiParameters"

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
      compValue: encodeAbiParameters(
        ["bytes32"],
        [allowanceKey]
      ) as `0x${string}`,
    }
  }

export const callWithinAllowance = (allowanceKey: `0x${string}`) => () => {
  return {
    paramType: ParameterType.None,
    operator: Operator.CallWithinAllowance,
    compValue: encodeAbiParameters(
      ["bytes32"],
      [allowanceKey]
    ) as `0x${string}`,
  }
}

export const etherWithinAllowance = (allowanceKey: `0x${string}`) => () => {
  return {
    paramType: ParameterType.None,
    operator: Operator.EtherWithinAllowance,
    compValue: encodeAbiParameters(
      ["bytes32"],
      [allowanceKey]
    ) as `0x${string}`,
  }
}
