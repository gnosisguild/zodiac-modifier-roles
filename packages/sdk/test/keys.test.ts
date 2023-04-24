import { expect } from "chai"

import { decodeKey, encodeKey } from "../src/keys"

describe.only("encodeKey", () => {
  it("should encode a human readable name to bytes32", () => {
    expect(encodeKey("test")).to.be("")
  })
})

describe.only("decodeKey", () => {
  it("should return the original human readable name (in lowercase)", () => {
    expect(decodeKey(encodeKey("test"))).to.be("test")
    expect(decodeKey(encodeKey("TEST"))).to.be("test")
    expect(decodeKey(encodeKey("0123456789_"))).to.be("0123456789_")
  })
})
