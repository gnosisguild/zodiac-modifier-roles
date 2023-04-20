import { Placeholder } from "../types"

import { forAll } from "./batching"
import { matchesAbi } from "./conditions"
import { or } from "./conditions/branching"

export const allowErc20Approve = (
  tokens: string[],
  spenders: (string | Placeholder<string>)[]
) => {
  if (spenders.length === 0) return []

  return forAll(tokens, {
    signature: "approve(address,uint256)",
    condition: matchesAbi(
      [
        spenders.length === 1
          ? spenders[0]
          : or(...(spenders as [string, string, ...string[]])),
      ],
      ["address", "uint256"]
    ),
  })
}

export const allowErc20Revoke = (
  tokens: string[],
  spenders?: (string | Placeholder<string>)[]
) => {
  if (spenders && spenders.length === 0) return []

  return forAll(tokens, {
    signature: "approve(address,uint256)",
    condition:
      spenders &&
      matchesAbi(
        [
          spenders.length === 1
            ? spenders[0]
            : or(...(spenders as [string, string, ...string[]])),
          0,
        ],
        ["address", "uint256"]
      ),
  })
}

export const allowErc20Transfer = (tokens: string[], recipients: string[]) => {
  if (recipients.length === 0) return []

  return forAll(tokens, {
    signature: "transfer(address,uint256)",
    condition: matchesAbi(
      [
        recipients.length === 1
          ? recipients[0]
          : or(...(recipients as [string, string, ...string[]])),
      ],
      ["address"]
    ),
  })
}
