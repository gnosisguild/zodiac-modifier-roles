import { Placeholder } from "../types"

import { forAll } from "./batching"
import { or } from "./branching"
import { inputsMatch } from "./matches"

export const allowErc20Approve = (
  tokens: string[],
  spenders: (string | Placeholder<string>)[]
) =>
  forAll(tokens, {
    signature: "approve(address,uint256)",
    condition: inputsMatch(
      [spenders.length === 1 ? spenders[0] : or(...spenders)],
      ["address", "uint256"]
    ),
  })

export const allowErc20Revoke = (
  tokens: string[],
  spenders: (string | Placeholder<string>)[]
) =>
  forAll(tokens, {
    signature: "approve(address,uint256)",
    condition: inputsMatch(
      [spenders.length === 1 ? spenders[0] : or(...spenders), 0],
      ["address", "uint256"]
    ),
  })

export const allowErc20Transfer = (tokens: string[], recipients: string[]) =>
  forAll(tokens, {
    signature: "transfer(address,uint256)",
    condition: inputsMatch(
      [recipients.length === 1 ? recipients[0] : or(...recipients)],
      ["address"]
    ),
  })
