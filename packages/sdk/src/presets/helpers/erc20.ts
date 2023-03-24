import { defaultAbiCoder } from "ethers/lib/utils"

import { Comparison, ParameterType } from "../../types"
import { Placeholder } from "../types"

import { equalTo, oneOf } from "./basic"
import { forAll } from "./batch"

export const allowErc20Approve = (
  tokens: string[],
  spenders: (string | Placeholder<string>)[]
) =>
  forAll(tokens, {
    signature: "approve(address,uint256)",
    condition:
      spenders.length === 1
        ? equalTo(spenders[0], "address")
        : oneOf(spenders, "address"),
  })

export const allowErc20Transfer = (tokens: string[], recipients: string[]) =>
  forAll(tokens, {
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
