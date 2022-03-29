import { keccak256, toUtf8Bytes } from "ethers/lib/utils";

import { AVATAR_ADDRESS_PLACEHOLDER } from "../placeholders";
import {
  Comparison,
  ExecutionOptions,
  ParameterType,
  AllowFunction,
  ScopeParam,
} from "../types";

export const functionSighash = (signature: string) =>
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
      value: spenders,
    },
  ],
  executionOption: ExecutionOptions.None,
});

export const staticEqual = (
  value: string | typeof AVATAR_ADDRESS_PLACEHOLDER
): ScopeParam => ({
  comparison: Comparison.EqualTo,
  type: ParameterType.Static,
  value,
});
