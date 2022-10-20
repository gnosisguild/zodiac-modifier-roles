import { Pool } from "./types"

export const allowRegularPool = (pool: Pool) => {
  return [
    { tokens: [...pool.tokens], spenders: [pool.address] },
    {
      targetAddresses: [pool.address],
      signature: `add_liquidity(uint256[${pool.tokens.length}],uint256)`,
    },
  ]
}
