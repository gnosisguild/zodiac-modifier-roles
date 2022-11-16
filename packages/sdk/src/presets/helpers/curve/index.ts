import { PresetAllowEntry } from "../../../types"

import { allowGauge } from "./gauge"
import pools from "./pools"
import { allowRegularPool } from "./regular"
import { Pool } from "./types"
import { allowZap } from "./zap"

const findPool = (name: Pool["name"]) => {
  const pool = pools.find((pool) => pool.name === name)
  if (!pool) {
    throw new Error(`Pool not found: ${pool}`)
  }
  return pool
}

export const allowCurvePool = (name: Pool["name"]) => {
  const pool = findPool(name)

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
