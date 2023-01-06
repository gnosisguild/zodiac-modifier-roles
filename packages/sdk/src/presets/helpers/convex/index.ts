import { PresetAllowEntry } from "../../../types"
import { allowErc20Approve } from "../erc20"

import pools from "./pools"
import { Pool } from "./types"

const BOOSTER = "0xF403C135812408BFbE8713b5A23a04b3D48AAE31"
const REWARD_POOL_DEPOSIT_WRAPPER = "0xB188b1CB84Fb0bA13cb9ee1292769F903A9feC59"

const findPool = (name: Pool["name"]) => {
  const pool = pools.find((pool) => pool.name === name)
  if (!pool) {
    throw new Error(`Pool not found: ${pool}`)
  }
  return pool
}

export const allowConvexPool = (name: Pool["name"]): PresetAllowEntry[] => {
  const pool = findPool(name)

  const result: PresetAllowEntry[] = [
    ...allowErc20Approve([pool.token], [BOOSTER]),
    {
      targetAddress: BOOSTER,
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

  //Only boosted pools do not have the "underlyingTokens" key, though there's only one boosted pool at the moment
  if ("underlyingTokens" in pool) {
    result.push(
      ...allowErc20Approve(
        [...pool.underlyingTokens],
        [REWARD_POOL_DEPOSIT_WRAPPER]
      ),
      {
        targetAddress: REWARD_POOL_DEPOSIT_WRAPPER,
        signature:
          "depositSingle(address,address,uint256,bytes32,(address[],uint256[],bytes,bool))",
      }
    )
  }
  return result
}
