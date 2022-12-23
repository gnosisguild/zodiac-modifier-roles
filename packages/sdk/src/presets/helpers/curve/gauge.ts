import { PresetAllowEntry } from "../../../types"
import { AVATAR_ADDRESS } from "../../placeholders"
import { allowErc20Approve } from "../erc20"
import { staticEqual } from "../utils"

import { Pool } from "./types"

const CRV_MINTER_ADDRESS = "0xd061D61a4d941c39E5453435B6345Dc261C2fcE0"

export const allowGauge = (pool: Pool) => {
  if (!("gauge" in pool)) return []

  const result: PresetAllowEntry[] = [
    ...allowErc20Approve([pool.token], [pool.gauge.address]),
    {
      targetAddress: pool.gauge.address,
      signature: "deposit(uint256)",
    },
    {
      targetAddress: pool.gauge.address,
      signature: "withdraw(uint256)",
    },
    {
      targetAddress: CRV_MINTER_ADDRESS,
      signature: "mint(address)",
      params: { [0]: staticEqual(AVATAR_ADDRESS) },
    },
  ]

  if (pool.gauge.type !== "LiquidityGauge") {
    result.push({
      targetAddress: pool.gauge.address,
      signature: "claim_rewards(address)",
      params: { [0]: staticEqual(AVATAR_ADDRESS) },
    })
  }

  return result
}
