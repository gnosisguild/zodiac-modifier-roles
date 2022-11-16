import { PresetAllowEntry } from "../../../types"
import { allowErc20Approve } from "../erc20"

import pools from "./pools"
import { Pool } from "./types"

const BOOSTER_ADDRESS = "0x7818A1DA7BD1E64c199029E86Ba244a9798eEE10"
const REWARD_POOL_DEPOSIT_WRAPPER_ADDRESS =
  "0xB188b1CB84Fb0bA13cb9ee1292769F903A9feC59"

const findPool = (name: Pool["name"]) => {
  const pool = pools.find((pool) => pool.name === name)
  if (!pool) {
    throw new Error(`Pool not found: ${pool}`)
  }
  return pool
}

export const allowAuraPool = (name: Pool["name"]): PresetAllowEntry[] => {
  const pool = findPool(name)

  const result: PresetAllowEntry[] = [
    ...allowErc20Approve([pool.token], [BOOSTER_ADDRESS]),
    {
      targetAddress: BOOSTER_ADDRESS,
      signature: "deposit(uint256,uint256,bool)",
    },
    {
      targetAddress: pool.rewarder,
      signature: "withdrawAndUnwrap(uint256,bool)",
    },
    {
      targetAddress: pool.rewarder,
      signature: "getReward()",
    },
  ]

  //Only boosted pools do not have the "tokens" key, though there's only one boosted pool at the moment
  if ("tokens" in pool) {
    result.push(
      ...allowErc20Approve(
        [...pool.tokens],
        [REWARD_POOL_DEPOSIT_WRAPPER_ADDRESS]
      ),
      {
        targetAddress: REWARD_POOL_DEPOSIT_WRAPPER_ADDRESS,
        signature: "depositSingle(address,address,uint256,bytes32,tuple)",
      }
    )
  }
  return result
}
