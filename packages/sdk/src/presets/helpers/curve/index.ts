import pools from "./pools"
import { allowRegularPool } from "./regular"

const findPool = (poolNameOrAddress: string) =>
  pools.find(
    (pool) =>
      pool.name === poolNameOrAddress || pool.address === poolNameOrAddress
  )

const allowCurvePool = (poolNameOrTokenAddress: string) => {
  const pool = findPool(poolNameOrTokenAddress)

  if (!pool) {
    throw new Error(`Pool not found: ${poolNameOrTokenAddress}`)
  }

  switch (pool.type) {
    case "regular":
      return allowRegularPool(pool)
    default:
      throw new Error(`Not yet implemented: ${pool.type}`)
  }
}

export default allowCurvePool
