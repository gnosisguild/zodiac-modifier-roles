import { defaultAbiCoder } from "ethers/lib/utils"

import {
  Comparison,
  ExecutionOptions,
  ParameterType,
  PresetFunction,
} from "../../types"

import { staticEqual } from "./utils"

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
