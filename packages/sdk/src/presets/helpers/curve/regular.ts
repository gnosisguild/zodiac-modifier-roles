import { PresetAllowEntry } from "../../../types"
import { AVATAR_ADDRESS_PLACEHOLDER } from "../../placeholders"
import { allowErc20Approve } from "../erc20"
import { staticEqual } from "../utils"

import { Pool } from "./types"

const CRV_MINTER_ADDRESS = "0xd061D61a4d941c39E5453435B6345Dc261C2fcE0"

export const allowRegularPool = (pool: Pool): PresetAllowEntry[] => {
  const tokens = (pool.tokens as readonly string[]).filter(
    (token) =>
      token.toLowerCase() !== "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
  )
  const poolFunctions: PresetAllowEntry[] = [
    //Gotta make sure the token address is not "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
    ...allowErc20Approve(tokens, [pool.address]),
    {
      targetAddress: pool.address,
      signature: "add_liquidity(uint256[${pool.tokens.length}],uint256)",
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
      signature:
        "remove_liquidity_imbalance(uint256[${pool.tokens.length}],uint256)",
    },
    {
      targetAddress: pool.address,
      signature: "exchange(int128,int128,uint256,uint256)",
    },
  ]

  if (pool.meta === true) {
    poolFunctions.push({
      targetAddress: pool.address,
      signature: "exchange_underlying(int128,int128,uint256,uint256)",
    })
  }

  const result = poolFunctions

  if ("gauge" in pool) {
    const gaugeFunctions = [
      ...allowErc20Approve([pool.token], [pool.gauge.address]),
      {
        targetAddress: pool.gauge.address,
        signature: "deposit(uint256)",
      },
      {
        targetAddress: pool.gauge.address,
        signature: "withdraw(uint256)",
      },
      //Define minter address as constant
      {
        targetAddress: CRV_MINTER_ADDRESS,
        signature: "mint(address)",
        params: { [0]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER) },
      },
    ]

    if (pool.gauge.type !== "LiquidityGauge") {
      gaugeFunctions.push({
        targetAddress: pool.gauge.address,
        signature: "claim_rewards(address)",
        params: { [0]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER) },
      })
    }

    result.push(...gaugeFunctions)
  }

  if ("zap" in pool) {
    if ("basePool" in pool.zap) {
      //Ask Nico about the approvals which are missing in Python
      result.push(
        ...allowErc20Approve([...pool.zap.basePool.tokens], [pool.zap.address])
      )
    }
    const zapFunctions = [
      {
        targetAddress: pool.zap.address,
        signature:
          "add_liquidity(uint256[${pool.tokens.length+pool.zap.basePool.tokens.length-1}],uint256)",
      },
      {
        targetAddress: pool.zap.address,
        signature: "remove_liquidity_one_coin(uint256,int128,uint256)",
      },
      {
        targetAddress: pool.zap.address,
        signature:
          "remove_liquidity(uint256,uint256[${pool.tokens.length+pool.zap.basePool.tokens.length-1}])",
      },
      {
        targetAddress: pool.zap.address,
        signature:
          "signature': 'remove_liquidity_imbalance(uint256[${pool.tokens.length+pool.zap.basePool.tokens.length-1}],uint256)",
      },
    ]

    result.push(...zapFunctions)
  }

  return result
}
