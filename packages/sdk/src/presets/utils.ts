import { defaultAbiCoder, keccak256, toUtf8Bytes } from "ethers/lib/utils"

import {
  Comparison,
  ExecutionOptions,
  ParameterType,
  PresetFunction,
  PresetScopeParam,
} from "../types"

interface ApprovePairing {
  tokens: string[]
  spenders: string[]
}

export const allowErc20Approve = (
  pairings: ApprovePairing[]
): PresetFunction[] => {
  const spendersForToken = pairings.reduce((spendersForToken, pairing) => {
    pairing.tokens.forEach((token) => {
      if (!spendersForToken[token]) spendersForToken[token] = new Set()
      spendersForToken[token] = new Set([
        ...spendersForToken[token],
        ...pairing.spenders,
      ])
    })
    return spendersForToken
  }, {} as Record<string, Set<string>>)

  return Object.entries(spendersForToken).map(([token, spenders]) => ({
    targetAddresses: [token],
    signature: "approve(address,uint256)",
    params: [
      spenders.size === 1
        ? staticEqual([...spenders][0], "address")
        : {
            type: ParameterType.Static,
            comparison: Comparison.OneOf,
            value: [...spenders].map((spender) =>
              defaultAbiCoder.encode(["address"], [spender])
            ),
          },
      undefined,
    ],
    options: ExecutionOptions.None,
  }))
}

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

const encodeValue = (
  value: string | symbol,
  type?: string
): string | symbol => {
  let encodedValue = value
  if (typeof value !== "symbol") {
    if (!type) {
      throw new Error("the value type must be specified")
    } else {
      encodedValue = defaultAbiCoder.encode([type], [value])
    }
  }
  return encodedValue
}

export const staticEqual = (value: any, type?: string): PresetScopeParam => ({
  comparison: Comparison.EqualTo,
  type: ParameterType.Static,
  value: encodeValue(value, type),
})

export const dynamicEqual = (value: any, type?: string): PresetScopeParam => ({
  comparison: Comparison.EqualTo,
  type: ParameterType.Dynamic,
  value: encodeValue(value, type),
})

export const oneOf = (value: any[], type?: string): PresetScopeParam => ({
  comparison: Comparison.OneOf,
  type: ParameterType.Static,
  value: value.map((v) => encodeValue(v, type)),
})

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
