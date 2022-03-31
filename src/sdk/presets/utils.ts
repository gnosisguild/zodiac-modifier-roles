import {
  defaultAbiCoder,
  keccak256,
  ParamType,
  solidityPack,
  toUtf8Bytes,
} from "ethers/lib/utils";

import { AVATAR_ADDRESS_PLACEHOLDER } from "../placeholders";
import {
  Comparison,
  ExecutionOptions,
  ParameterType,
  AllowFunction,
  ScopeParam,
} from "../types";

export const functionSighash = (signature: string): string =>
  keccak256(toUtf8Bytes(signature)).substring(0, 10);

export const allowErc20Approve = (
  tokens: string[],
  spenders: string[]
): AllowFunction => ({
  targetAddresses: tokens,
  functionSig: functionSighash("approve(address,uint256)"),
  params: [
    {
      type: ParameterType.Static,
      comparison: Comparison.OneOf,
      value: spenders.map((spender) =>
        defaultAbiCoder.encode(["address"], [spender])
      ),
    },
  ],
  options: ExecutionOptions.None,
});

export const staticEqual = (
  value: string | typeof AVATAR_ADDRESS_PLACEHOLDER,
  type?: string
): ScopeParam => {
  if (value === AVATAR_ADDRESS_PLACEHOLDER) type = "address";
  if (!type) throw new Error("the value type must be specified");

  return {
    comparison: Comparison.EqualTo,
    type: ParameterType.Static,
    value:
      value === AVATAR_ADDRESS_PLACEHOLDER
        ? value
        : defaultAbiCoder.encode([type], [value]),
  };
};

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
