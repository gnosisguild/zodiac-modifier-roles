import { defaultAbiCoder, keccak256, toUtf8Bytes } from "ethers/lib/utils"

import { AVATAR_ADDRESS_PLACEHOLDER } from "../placeholders"
import {
  Comparison,
  ExecutionOptions,
  ParameterType,
  PresetFunction,
  PresetScopeParam,
} from "../types"

export const allowErc20Approve = (
  tokens: string[],
  spenders: string[]
): PresetFunction => ({
  targetAddresses: tokens,
  signature: "approve(address,uint256)",
  params: [
    spenders.length === 1
      ? staticEqual(spenders[0], "address")
      : {
          type: ParameterType.Static,
          comparison: Comparison.OneOf,
          value: spenders.map((spender) =>
            defaultAbiCoder.encode(["address"], [spender])
          ),
        },
    undefined,
  ],
  options: ExecutionOptions.None,
})

export const allowErc20Transfer = (
  tokens: string[],
  recipients: string[]
): PresetFunction => ({
  targetAddresses: tokens,
  signature: "transfer(address,uint256)",
  params: [
    recipients.length === 1
      ? staticEqual(recipients[0], "address")
      : {
          type: ParameterType.Static,
          comparison: Comparison.OneOf,
          value: recipients.map((recipient) =>
            defaultAbiCoder.encode(["address"], [recipient])
          ),
        },
    undefined,
  ],
  options: ExecutionOptions.None,
})

export const staticEqual = (
  value: string | typeof AVATAR_ADDRESS_PLACEHOLDER,
  type?: string
): PresetScopeParam => {
  if (value === AVATAR_ADDRESS_PLACEHOLDER) type = "address"
  if (!type) throw new Error("the value type must be specified")

  return {
    comparison: Comparison.EqualTo,
    type: ParameterType.Static,
    value:
      value === AVATAR_ADDRESS_PLACEHOLDER
        ? value
        : defaultAbiCoder.encode([type], [value]),
  }
}

export const oneOf = (
  value: (string | typeof AVATAR_ADDRESS_PLACEHOLDER)[],
  type?: string
): PresetScopeParam => {
  if (value.includes(AVATAR_ADDRESS_PLACEHOLDER)) type = "address"
  if (!type) throw new Error("the value type must be specified")

  return {
    comparison: Comparison.OneOf,
    type: ParameterType.Static,
    value: value.map((v) =>
      v === AVATAR_ADDRESS_PLACEHOLDER
        ? v
        : defaultAbiCoder.encode([type as string], [v])
    ),
  }
}

// export const greaterThanUint = (
//   value: number | string | BigInt
// ): ScopeParam => ({
//   comparison: Comparison.GreaterThan,
//   type: ParameterType.Static,
//   value: defaultAbiCoder.encode(["uint256"], [value]),
// });
// export const greaterThanInt = (
//   value: number | string | BigInt
// ): ScopeParam => ({
//   comparison: Comparison.GreaterThan,
//   type: ParameterType.Static,
//   value: defaultAbiCoder.encode(["int256"], [value]),
// });

// function encodeDynamic(types: any[], values: any[]) {
//   return solidityPack(types, values);
// }

// function encodeDynamic32(types: any[], values: any[]) {
//   return solidityPack(types, values);
// }
