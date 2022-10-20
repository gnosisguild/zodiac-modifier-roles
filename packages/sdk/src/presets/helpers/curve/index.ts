import pools from "./pools"
import { allowRegularPool } from "./regular"
import { Pool } from "./types"

const findPool = (
  pools: Record<string, Pool>,
  poolNameOrTokenAddress: string
) =>
  pools[poolNameOrTokenAddress] ||
  Object.values(pools).find((pool) => pool.name === poolNameOrTokenAddress)

const allowCurvePool = (poolNameOrTokenAddress: string) => {
  const regularPool = findPool(pools.regular, poolNameOrTokenAddress)
  const factoryPool = findPool(pools.factory, poolNameOrTokenAddress)
  const cryptoV2Pool = findPool(pools.cryptoV2, poolNameOrTokenAddress)
  const cryptoFactoryPool = findPool(
    pools.cryptoFactory,
    poolNameOrTokenAddress
  )

  if (regularPool) {
    return allowRegularPool(regularPool)
  }
  if (factoryPool) {
    // return allowFactoryPool(regularPool)
  }
  if (cryptoV2Pool) {
    // return allowCryptoV2Pool(regularPool)
  }
  if (cryptoFactoryPool) {
    // return allowCryptoFactoryPool(regularPool)
  }

  throw new Error(
    `No pool found with token address or name ${poolNameOrTokenAddress}`
  )
}

export default allowCurvePool
