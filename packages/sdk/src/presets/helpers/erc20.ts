import { defaultAbiCoder } from "ethers/lib/utils"

import { Comparison, ParameterType } from "../../types"

import { forAllTargetAddresses, staticEqual } from "./basic"

export const allowErc20Approve = (tokens: string[], spenders: string[]) =>
  forAllTargetAddresses(tokens, {
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
    ],
  })

export const allowErc20Transfer = (tokens: string[], recipients: string[]) =>
  forAllTargetAddresses(tokens, {
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
    ],
  })
