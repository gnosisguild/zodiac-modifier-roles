import { PresetAllowEntry, PresetAllowEntry } from "../../../types"
import {
  AVATAR_ADDRESS_PLACEHOLDER,
  AVATAR_ADDRESS_PLACEHOLDER,
} from "../../placeholders"
import { staticEqual, staticEqual } from "../utils"

import { Pool } from "./types"

const CRV_MINTER_ADDRESS = "0xd061D61a4d941c39E5453435B6345Dc261C2fcE0"

export const allowRegularPool = (pool: Pool): PresetAllowEntry[] => {
  const poolFunctions: PresetAllowEntry[] = [
    //Gotta make sure the token address is not "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
    {
      tokens: pool.tokens.filter(
        (token) =>
          token.toLowerCase() !== "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
      ),
      spenders: [pool.address],
    },
    {
      targetAddresses: [pool.address],
      signature: "add_liquidity(uint256[${pool.tokens.length}],uint256)",
    },
    {
      targetAddresses: [pool.address],
      signature: "remove_liquidity_one_coin(uint256,int128,uint256)",
    },
    {
      targetAddresses: [pool.address],
      signature: "remove_liquidity(uint256,uint256[${pool.tokens.length}])",
    },
    {
      targetAddresses: [pool.address],
      signature:
        "remove_liquidity_imbalance(uint256[${pool.tokens.length}],uint256)",
    },
    {
      targetAddresses: [pool.address],
      signature: "exchange(int128,int128,uint256,uint256)",
    },
  ]

  if (pool.meta === true) {
    poolFunctions.push({
      targetAddresses: [pool.address],
      signature: "exchange_underlying(int128,int128,uint256,uint256)",
    })
  }

  const result = poolFunctions

  if ("gauge" in pool) {
    const gaugeFunctions = [
      { tokens: [pool.token], spenders: [pool.gauge.address] },
      {
        targetAddresses: [pool.gauge.address],
        signature: "deposit(uint256)",
      },
      {
        targetAddresses: [pool.gauge.address],
        signature: "withdraw(uint256)",
      },
      //Define minter address as constant
      {
        targetAddresses: [CRV_MINTER_ADDRESS],
        signature: "mint(address)",
        params: { [0]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER) },
      },
    ]

    if (pool.gauge.type !== "LiquidityGauge") {
      gaugeFunctions.push({
        targetAddresses: [pool.gauge.address],
        signature: "claim_rewards(address)",
        params: { [0]: staticEqual(AVATAR_ADDRESS_PLACEHOLDER) },
      })
    }

    result.push(...gaugeFunctions)
  }

  if ("zap" in pool) {
    const zapFunctions = [
      //Ask Nico about the approvals which are missing in Python
      { tokens: [...pool.zap.basePool.tokens], spenders: [pool.zap.address] },
      {
        targetAddresses: [pool.zap.address],
        signature:
          "add_liquidity(uint256[${pool.tokens.length+pool.zap.basePool.tokens.length-1}],uint256)",
      },
      {
        targetAddresses: [pool.zap.address],
        signature: "remove_liquidity_one_coin(uint256,int128,uint256)",
      },
      {
        targetAddresses: [pool.zap.address],
        signature:
          "remove_liquidity(uint256,uint256[${pool.tokens.length+pool.zap.basePool.tokens.length-1}])",
      },
      {
        targetAddresses: [pool.zap.address],
        signature:
          "signature': 'remove_liquidity_imbalance(uint256[${pool.tokens.length+pool.zap.basePool.tokens.length-1}],uint256)",
      },
    ]

    result.push(...zapFunctions)
  }

  return result
}
