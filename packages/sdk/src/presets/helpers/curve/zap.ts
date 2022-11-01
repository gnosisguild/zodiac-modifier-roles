import { PresetAllowEntry } from "../../../types"
import { allowErc20Approve } from "../erc20"

import { Pool } from "./types"

export const allowZap = (pool: Pool) => {
  if (!("zap" in pool)) return []

  const result: PresetAllowEntry[] = [
    {
      targetAddress: pool.zap.address,
      signature: "remove_liquidity_one_coin(uint256,int128,uint256)",
    },
  ]
  if ("basePool" in pool.zap) {
    const basePoolFunctions: PresetAllowEntry[] = [
      //Ask Nico about the approvals which are missing in Python
      ...allowErc20Approve([...pool.zap.basePool.tokens], [pool.zap.address]),
      {
        targetAddress: pool.zap.address,
        signature: `add_liquidity(uint256[${
          pool.tokens.length + pool.zap.basePool.tokens.length - 1
        }],uint256)`,
      },
      {
        targetAddress: pool.zap.address,
        signature: "remove_liquidity_one_coin(uint256,int128,uint256)",
      },
      {
        targetAddress: pool.zap.address,
        signature: `remove_liquidity(uint256,uint256[${
          pool.tokens.length + pool.zap.basePool.tokens.length - 1
        }])`,
      },
      {
        targetAddress: pool.zap.address,
        signature: `remove_liquidity_imbalance(uint256[${
          pool.tokens.length + pool.zap.basePool.tokens.length - 1
        }],uint256)`,
      },
    ]
    result.push(...basePoolFunctions)
  }
  return result
}
