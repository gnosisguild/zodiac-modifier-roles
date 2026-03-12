import { expect, it, suite } from "vitest"
import { hexlify, zeroPadValue } from "ethers"
import { Allowance } from "zodiac-roles-deployments"

import { diffAllowances } from "./allowances"

const key1 = hexlify(zeroPadValue("0x01", 32)) as `0x${string}`
const key2 = hexlify(zeroPadValue("0x02", 32)) as `0x${string}`
const key3 = hexlify(zeroPadValue("0x03", 32)) as `0x${string}`

const Zeroes = {
  balance: 0n,
  maxRefill: 0n,
  refill: 0n,
  period: 0n,
  timestamp: 0n,
}

suite("applyAllowances", () => {
  it("all insertions when passed in no previous allowances", () => {
    const next: Allowance[] = [
      {
        key: key2,
        balance: 6n,
        maxRefill: 7n,
        refill: 8n,
        period: 9n,
        timestamp: 10n,
      },
      {
        key: key3,
        balance: 16n,
        maxRefill: 17n,
        refill: 18n,
        period: 19n,
        timestamp: 20n,
      },
    ]

    expect(
      diffAllowances({
        next,
      })
    ).to.deep.equal(
      diffAllowances({
        prev: [],
        next,
      })
    )

    const { minus, plus } = diffAllowances({ next })

    expect(minus).toHaveLength(0)
    expect(plus).toHaveLength(2)
    expect(plus).toEqual([
      { call: "setAllowance", ...next[0] },
      { call: "setAllowance", ...next[1] },
    ])
  })
  it("all deletions when passed in no current allowances", () => {
    const prev: Allowance[] = [
      {
        key: key1,
        balance: 1n,
        maxRefill: 2n,
        refill: 3n,
        period: 4n,
        timestamp: 5n,
      },
      {
        key: key2,
        balance: 6n,
        maxRefill: 7n,
        refill: 8n,
        period: 9n,
        timestamp: 10n,
      },
    ]

    expect(
      diffAllowances({
        prev,
        next: [],
      })
    ).to.deep.equal(
      diffAllowances({
        prev,
      })
    )

    const { minus, plus } = diffAllowances({ prev, next: [] })
    expect(minus).toHaveLength(2)
    expect(plus).toHaveLength(0)
    expect(minus).toEqual([
      { call: "setAllowance", key: key1, ...Zeroes },
      { call: "setAllowance", key: key2, ...Zeroes },
    ])
  })

  it("when overlapping, it preserves timestamp and balance", () => {
    const prev: Allowance[] = [
      {
        key: key1,
        balance: 1n,
        maxRefill: 1n,
        refill: 1n,
        period: 1n,
        timestamp: 1n,
      },
      {
        key: key2,
        balance: 0n,
        maxRefill: 2n,
        refill: 2n,
        period: 2n,
        timestamp: 22n,
      },
    ]

    const next: Allowance[] = [
      {
        key: key2,
        balance: 2n,
        maxRefill: 2n,
        refill: 2n,
        period: 2n,
        timestamp: 2n,
      },
      {
        key: key3,
        balance: 4n,
        maxRefill: 4n,
        refill: 4n,
        period: 4n,
        timestamp: 4n,
      },
    ]

    const { minus, plus } = diffAllowances({ prev, next })
    expect(minus).toHaveLength(1)
    expect(plus).toHaveLength(1)

    expect(minus).toEqual([{ call: "setAllowance", key: key1, ...Zeroes }])
    expect(plus).toEqual([
      {
        call: "setAllowance",
        key: key3,
        balance: 4n,
        maxRefill: 4n,
        refill: 4n,
        period: 4n,
        timestamp: 4n,
      },
    ])
  })

  it("resets balance and timestamp when updating allowance", () => {
    const prev: Allowance[] = [
      {
        key: key1,
        balance: 0n,
        maxRefill: 1n,
        refill: 1n,
        period: 1n,
        timestamp: 11n,
      },
    ]

    const next: Allowance[] = [
      {
        key: key1,
        balance: 2n,
        maxRefill: 2n,
        refill: 2n,
        period: 2n,
        timestamp: 0n,
      },
    ]

    const { minus, plus } = diffAllowances({ prev, next })
    expect(minus).toHaveLength(0)
    expect(plus).toEqual([
      {
        call: "setAllowance",
        key: key1,
        balance: 2n,
        maxRefill: 2n,
        refill: 2n,
        period: 2n,
        timestamp: 0n,
      },
    ])
  })
})
