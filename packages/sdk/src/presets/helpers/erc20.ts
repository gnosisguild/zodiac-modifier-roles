import { Placeholder } from "../types"

import { equalTo, oneOf } from "./basic"
import { forAll } from "./batch"
import { matches } from "./matches"

export const allowErc20Approve = (
  tokens: string[],
  spenders: (string | Placeholder<string>)[]
) =>
  forAll(tokens, {
    signature: "approve(address,uint256)",
    condition: matches(
      [
        spenders.length === 1
          ? equalTo(spenders[0], "address")
          : oneOf(spenders, "address"),
      ],
      ["address"]
    ),
  })

export const allowErc20Revoke = (
  tokens: string[],
  spenders: (string | Placeholder<string>)[]
) =>
  forAll(tokens, {
    signature: "approve(address,uint256)",
    condition: matches(
      [
        spenders.length === 1
          ? equalTo(spenders[0], "address")
          : oneOf(spenders, "address"),
        equalTo(0, "uint256"),
      ],
      ["address", "uint256"]
    ),
  })

export const allowErc20Transfer = (tokens: string[], recipients: string[]) =>
  forAll(tokens, {
    signature: "transfer(address,uint256)",
    condition: matches(
      [
        recipients.length === 1
          ? equalTo(recipients[0], "address")
          : oneOf(recipients, "address"),
      ],
      ["address"]
    ),
  })
