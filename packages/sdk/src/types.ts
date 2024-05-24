import { BigNumber } from "ethers"

export interface Allowance {
  key: `0x${string}`
  period: number
  refill: BigNumber
  timestamp: number
  maxRefill: BigNumber
  balance: BigNumber
}
