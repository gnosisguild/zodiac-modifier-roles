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

  it("rejects a 32-byte-shaped string that is not hex", () => {
    // Long enough to look encoded, so it used to pass through untouched and
    // reach the chain as a key nothing was ever set under. It is not a valid
    // label either, which is what the error now says.
    expect(() => encodeKey(`0x${"z".repeat(64)}`)).toThrow("at most 31 bytes")
  })

  it("packs a short hex string as the label it is", () => {
    // Only a full 32 bytes counts as already encoded. Anything else is a
    // label, and both sides of an allowance pack it identically, so they agree.
    expect(encodeKey("0x1234")).toEqual(encodeKey("0x1234"))
    expect(decodeKey(encodeKey("0x1234"))).toEqual("0x1234")
  })
})

describe("decodeKey", () => {
  it("unpacks an encoded key", () => {
    expect(decodeKey(encodeKey("test-allowance"))).toEqual("test-allowance")
  })

  it("returns an already decoded key unchanged", () => {
    expect(decodeKey("test-allowance")).toEqual("test-allowance")
  })

  it("rejects a 32-byte-shaped string that is not hex", () => {
    expect(() => decodeKey(`0x${"z".repeat(64)}`)).toThrow("at most 31 bytes")
  })

  it("returns a short hex string unchanged, as a label", () => {
    expect(decodeKey("0x1234")).toEqual("0x1234")
  })

  it("explains a bytes32 that holds no packed label", () => {
    const hash = `0x${"ab".repeat(32)}`

    expect(() => decodeKey(hash)).toThrow("is not a packed label")
    expect(() => decodeKey(hash)).toThrow(hash)
  })
})
