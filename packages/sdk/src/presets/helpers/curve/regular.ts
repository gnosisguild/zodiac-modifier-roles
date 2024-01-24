import { PresetAllowEntry } from "../../types"
import { allowErc20Approve } from "../erc20"

import { Pool } from "./types"

export const allowRegularPool = (pool: Pool): PresetAllowEntry[] => {
  const tokens = (pool.tokens as readonly string[]).filter(
    (token) =>
      token.toLowerCase() !== "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
  )

  const result: PresetAllowEntry[] = [
    //Gotta make sure the token address is not "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
    ...allowErc20Approve(tokens, [pool.address]),
    {
      targetAddress: pool.address,
      signature: `add_liquidity(uint256[${pool.tokens.length}],uint256)`,
    },
    {
      targetAddress: pool.address,
      signature: "remove_liquidity_one_coin(uint256,int128,uint256)",
    },
    {
      targetAddress: pool.address,
      signature: "remove_liquidity(uint256,uint256[${pool.tokens.length}])",
    },
    {
      targetAddress: pool.address,
      signature: `remove_liquidity_imbalance(uint256[${pool.tokens.length}],uint256)`,
    },
    {
      targetAddress: pool.address,
      signature: "exchange(int128,int128,uint256,uint256)",
    },
  ]

  if (pool.meta === true) {
    result.push({
      targetAddress: pool.address,
      signature: "exchange_underlying(int128,int128,uint256,uint256)",
    })
  }

  return result
}
