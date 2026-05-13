import { test, expect } from "vitest"
import { allowSignTypedMessage, c } from "zodiac-roles-sdk"

test("typings — flat struct", () => {
  // Tests of the typing system: assignments below should compile (or error
  // where marked) without ever running the function.
  const types = {
    EIP712Domain: [
      { name: "name", type: "string" },
      { name: "version", type: "string" },
      { name: "chainId", type: "uint256" },
      { name: "verifyingContract", type: "address" },
    ],
    Order: [
      { name: "sellToken", type: "address" },
      { name: "buyToken", type: "address" },
      { name: "receiver", type: "address" },
      { name: "sellAmount", type: "uint256" },
    ],
  } as const

  type Args = Parameters<typeof allowSignTypedMessage<typeof types>>[0]

  // primitive values per field, partial struct scoping
  const _ok1: Args = {
    types,
    domain: { name: "My App", chainId: 1n },
    message: { sellToken: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" },
  }

  // condition functions per field
  const _ok2: Args = {
    types,
    domain: { chainId: c.eq(1) },
    message: { receiver: c.avatar },
  }

  // entire struct can be a condition function (e.g. c.pass)
  const _ok3: Args = {
    types,
    domain: c.pass,
    message: c.pass,
  }

  const _bad1: Args = {
    types,
    // @ts-expect-error - unknown field on domain
    domain: { foo: "bar" },
    message: { sellToken: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" },
  }

  const _bad2: Args = {
    types,
    domain: { name: "App" },
    // @ts-expect-error - unknown field on message
    message: { foo: "bar" },
  }

  const _bad3: Args = {
    types,
    // @ts-expect-error - number not assignable to a string field
    domain: { name: 42 },
    message: { sellToken: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" },
  }

  const _bad4: Args = {
    types,
    // @ts-expect-error - object not assignable to a primitive uint field
    domain: { chainId: { nested: 1 } },
    message: { sellToken: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" },
  }
})

test("typings — nested struct", () => {
  const types = {
    EIP712Domain: [
      { name: "name", type: "string" },
      { name: "chainId", type: "uint256" },
    ],
    Person: [
      { name: "name", type: "string" },
      { name: "wallet", type: "address" },
      { name: "attachments", type: "Attachment[]" },
    ],
    Attachment: [{ name: "filename", type: "string" }],
  } as const

  type Args = Parameters<typeof allowSignTypedMessage<typeof types>>[0]

  // nested struct scoping inside an array field
  const _ok: Args = {
    types,
    domain: { name: "App" },
    message: {
      name: "Vitalik",
      attachments: [{ filename: "doc.pdf" }],
    },
  }

  const _bad1: Args = {
    types,
    domain: { name: "App" },
    // @ts-expect-error - unknown nested field on a struct in an array
    message: { attachments: [{ wrong: "x" }] },
  }

  const _bad2: Args = {
    types,
    domain: { name: "App" },
    // @ts-expect-error - wrong primitive at a nested field
    message: { attachments: [{ filename: 42 }] },
  }
})

test("runtime — produces a permission targeting SignTypedMessageLib", () => {
  const types = {
    EIP712Domain: [
      { name: "name", type: "string" },
      { name: "chainId", type: "uint256" },
    ],
    Order: [
      { name: "sellToken", type: "address" },
      { name: "buyer", type: "address" },
    ],
  } as const

  const permission = allowSignTypedMessage({
    types,
    domain: { name: "App", chainId: 1n },
    message: { sellToken: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" },
  })

  expect(permission.targetAddress.toLowerCase()).toMatch(/^0x[0-9a-f]{40}$/)
  expect(permission.selector).toMatch(/^0x[0-9a-f]{8}$/)
  expect(permission.delegatecall).toBe(true)
  expect(permission.condition.children).toHaveLength(3)
})
