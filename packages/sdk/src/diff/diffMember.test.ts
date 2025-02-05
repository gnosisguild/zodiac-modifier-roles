import { expect, it, suite } from "vitest"
import { ZeroHash } from "ethers"

import { diffMembers } from "./diffMember"

const roleKey = ZeroHash
const AddressOne = `0x0000000000000000000000000000000000000001`
const AddressTwo = `0x0000000000000000000000000000000000000002`
const AddressThree = `0x0000000000000000000000000000000000000003`
const AddressFour = `0x0000000000000000000000000000000000000004`

suite("diffMembers", () => {
  it("works for both prev and next", () => {
    const prev: `0x${string}`[] = [AddressOne, AddressTwo, AddressThree]

    const next: `0x${string}`[] = [AddressTwo, AddressThree, AddressFour]

    const { minus, plus } = diffMembers({ roleKey, prev, next })
    expect(minus).toEqual([
      {
        call: "assignRoles",
        roleKey,
        member: AddressOne,
        join: false,
      },
    ])
    expect(plus).toEqual([
      {
        call: "assignRoles",
        roleKey,
        member: AddressFour,
        join: true,
      },
    ])
  })

  it("only prev", () => {
    const prev: `0x${string}`[] = [AddressOne, AddressTwo, AddressThree]

    const { minus, plus } = diffMembers({ roleKey, prev })
    expect(minus).toEqual([
      {
        call: "assignRoles",
        roleKey,
        member: AddressOne,
        join: false,
      },
      {
        call: "assignRoles",
        roleKey,
        member: AddressTwo,
        join: false,
      },
      {
        call: "assignRoles",
        roleKey,
        member: AddressThree,
        join: false,
      },
    ])
  })

  it("only next", () => {
    const next: `0x${string}`[] = [AddressTwo, AddressThree, AddressFour]

    const { minus, plus } = diffMembers({ roleKey, next })
    expect(minus).toEqual([])
    expect(plus).toEqual([
      {
        call: "assignRoles",
        roleKey,
        member: AddressTwo,
        join: true,
      },
      {
        call: "assignRoles",
        roleKey,
        member: AddressThree,
        join: true,
      },
      {
        call: "assignRoles",
        roleKey,
        member: AddressFour,
        join: true,
      },
    ])
  })
})
