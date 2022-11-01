import { PresetAllowEntry } from "../../../types"

import { allowGauge } from "./gauge"
import pools from "./pools"
import { allowRegularPool } from "./regular"
import { allowZap } from "./zap"

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

  const result: PresetAllowEntry[] = []
  switch (pool.type) {
    case "regular":
      result.push(...allowRegularPool(pool))
      break
    default:
      throw new Error(`Not yet implemented: ${pool.type}`)
  }

  if ("gauge" in pool) {
    result.push(...allowGauge(pool))
  }

  if ("zap" in pool) {
    result.push(...allowZap(pool))
  }

  return result
}

export default allowCurvePool
