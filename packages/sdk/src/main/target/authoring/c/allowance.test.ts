import { describe, expect, it } from "vitest"
import { ParamType } from "ethers"

import { abiEncode } from "../../../abiEncode"
import { encodeKey } from "../../../keys"
import { withinAllowance } from "./allowance"

const uint256 = ParamType.from("uint256")

describe("withinAllowance", () => {
  it("accepts an allowance key as a label", () => {
    expect(withinAllowance("test-allowance")(uint256)).toHaveProperty(
      "compValue",
      abiEncode(["bytes32"], [encodeKey("test-allowance")])
    )
  })

  it("encodes a label and an already encoded key to the same condition", () => {
    expect(withinAllowance("test-allowance")(uint256)).toEqual(
      withinAllowance(encodeKey("test-allowance"))(uint256)
    )
  })

  it("rejects a malformed encoded key", () => {
    expect(() => withinAllowance("0x1234")(uint256)).toThrow("not 32")
  })
})
