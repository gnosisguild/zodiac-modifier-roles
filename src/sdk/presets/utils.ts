import { keccak256 } from "ethers/lib/utils";

import {
  Comparison,
  ExecutionOptions,
  ParameterType,
  AllowFunction,
} from "../types";

export const functionSighash = (signature: string) =>
  keccak256(signature).substring(0, 10);

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
