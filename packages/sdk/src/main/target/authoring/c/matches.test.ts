import { describe, expect, it } from "vitest"
import { Operator, ParameterType } from "../../../types"

import { calldataMatches } from "./matches"
import { encodeKey } from "../../../keys"

describe("calldataMatches", () => {
  it("correctly encodes EtherWithinAllowance conditions", () => {
    const result = calldataMatches([], [], {
      etherWithinAllowance: encodeKey("test-allowance"),
    })()

    expect(result).toEqual({
      paramType: ParameterType.Calldata,
      operator: Operator.Matches,
      children: [
        {
          paramType: ParameterType.None,
          operator: Operator.EtherWithinAllowance,
          compValue: encodeKey("test-allowance"),
        },
      ],
    })
  })

  it("accepts allowance keys as labels", () => {
    expect(
      calldataMatches([], [], {
        etherWithinAllowance: "test-allowance",
        callWithinAllowance: "other-allowance",
      })()
    ).toEqual(
      calldataMatches([], [], {
        etherWithinAllowance: encodeKey("test-allowance"),
        callWithinAllowance: encodeKey("other-allowance"),
      })()
    )
  })

  it("rejects a malformed encoded allowance key", () => {
    // This path assigns `compValue` directly, so before it went through
    // `encodeKey` a short hex reached the chain as a key nothing was set under.
    expect(() =>
      calldataMatches([], [], { etherWithinAllowance: "0x1234" })()
    ).toThrow("not 32")
  })
})
