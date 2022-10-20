import { defaultAbiCoder } from "ethers/lib/utils"

import { staticEqual } from "./presets/helpers/utils"
import {
  CoercedPresetAllowEntry,
  CoercedRolePreset,
  Comparison,
  ExecutionOptions,
  ParameterType,
  PresetErc20Approval,
  PresetFunction,
  RolePreset,
} from "./types"

const translateErc20Approvals = (preset: RolePreset): CoercedRolePreset => {
  const erc20ApprovalAllowEntries = preset.allow.filter(
    (allow) => "tokens" in allow
  ) as PresetErc20Approval[]
  const otherEntries = preset.allow.filter(
    (allow) => !("tokens" in allow)
  ) as CoercedPresetAllowEntry[]

  const spendersForToken = erc20ApprovalAllowEntries.reduce(
    (spendersForToken, { spenders, tokens }) => {
      tokens.forEach((token) => {
        if (!spendersForToken[token]) spendersForToken[token] = new Set()
        spendersForToken[token] = new Set([
          ...spendersForToken[token],
          ...spenders,
        ])
      })
      return spendersForToken
    },
    {} as Record<string, Set<string>>
  )

  const entriesForErc20Approvals: PresetFunction[] = Object.entries(
    spendersForToken
  ).map(([token, spenders]) => ({
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

  return {
    ...preset,
    allow: [...entriesForErc20Approvals, ...otherEntries],
  }
}

export default translateErc20Approvals
