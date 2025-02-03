import { Allowance } from "zodiac-roles-deployments"
import { Diff } from "./helpers"

export default function diffAllowances({
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
    .map((allowance) => ({
      ...allowance,
      balance: prev.find((a) => a.key == allowance.key)!.balance,
      timestamp: prev.find((a) => a.key == allowance.key)!.timestamp,
    }))

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
