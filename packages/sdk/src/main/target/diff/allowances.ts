import { Allowance } from "zodiac-roles-deployments"
import { Diff } from "./helpers"

export function diffAllowances({
  prev = [],
  next = [],
}: {
  prev?: Allowance[]
  next?: Allowance[]
}): Diff {
  const toDelete = prev.filter((allowance) =>
    next.every((a) => a.key !== allowance.key)
  )

  const toUpdate = next
    .filter((allowance) => prev.some((a) => a.key == allowance.key))
    // only update allowances with updated refill terms, don't mess with the dynamically updated balance and timestamp fields
    .filter((allowance) => {
      const existing = prev.find((a) => a.key == allowance.key)!
      return (
        allowance.refill !== existing.refill ||
        allowance.maxRefill !== existing.maxRefill ||
        allowance.period !== existing.period
      )
    })

  const toCreate = next.filter((allowance) =>
    prev.every((a) => a.key !== allowance.key)
  )

  return {
    minus: toDelete.map((allowance) => ({
      call: "setAllowance",
      key: allowance.key,
      refill: BigInt(0),
      maxRefill: BigInt(0),
      period: BigInt(0),
      balance: BigInt(0),
      timestamp: BigInt(0),
    })),
    plus: [...toUpdate, ...toCreate].map((allowance) => ({
      call: "setAllowance",
      ...allowance,
    })),
  }
}
