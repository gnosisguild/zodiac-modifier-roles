import { describe, expect, it } from "vitest"

import { decodeKey, encodeKey } from "./keys"

describe("encodeKey", () => {
  it("packs a label into bytes32", () => {
    const encoded = encodeKey("test-allowance")

    expect(encoded).toMatch(/^0x[0-9a-f]{64}$/)
    expect(decodeKey(encoded)).toEqual("test-allowance")
  })

  it("returns an already encoded key unchanged", () => {
    const encoded = encodeKey("test-allowance")

    expect(encodeKey(encoded)).toEqual(encoded)
  })

  it("rejects a label that does not fit into bytes32", () => {
    expect(() => encodeKey("a".repeat(32))).toThrow("at most 31 bytes")
  })

  it("names the key it could not encode", () => {
    expect(() => encodeKey("a".repeat(32))).toThrow("a".repeat(32))
  })

  it("rejects a malformed encoded key rather than packing its characters", () => {
    // Packing "0x1234" as a label yields a valid but different bytes32, which
    // would reference an allowance that was never set.
    expect(() => encodeKey("0x1234")).toThrow("is 2 bytes, not 32")
  })
})

describe("decodeKey", () => {
  it("unpacks an encoded key", () => {
    expect(decodeKey(encodeKey("test-allowance"))).toEqual("test-allowance")
  })

  it("returns an already decoded key unchanged", () => {
    expect(decodeKey("test-allowance")).toEqual("test-allowance")
  })

  it("rejects a malformed encoded key", () => {
    expect(() => decodeKey("0x1234")).toThrow("is 2 bytes, not 32")
  })
})
