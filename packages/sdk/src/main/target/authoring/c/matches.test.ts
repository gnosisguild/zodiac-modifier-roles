import { describe, expect, it } from "vitest"
import { Operator, Encoding } from "../../../types"

import { calldataMatches } from "./matches"
import { encodeKey } from "../../../keys"

describe("calldataMatches", () => {
  it("correctly encodes CallWithinAllowance conditions", () => {
    const result = calldataMatches([], [], {
      callWithinAllowance: encodeKey("test-allowance"),
    })()

    expect(result).toEqual({
      paramType: Encoding.AbiEncoded,
      operator: Operator.Matches,
      children: [
        {
          paramType: Encoding.None,
          operator: Operator.CallWithinAllowance,
          compValue: encodeKey("test-allowance"),
        },
      ],
    })
  })

  it("accepts allowance keys as labels", () => {
    expect(
      calldataMatches([], [], {
        callWithinAllowance: "test-allowance",
      })()
    ).toEqual(
      calldataMatches([], [], {
        callWithinAllowance: encodeKey("test-allowance"),
      })()
    )
  })

  it("encodes an allowance key that is not already bytes32", () => {
    // This path assigns `compValue` directly, so before it went through
    // `encodeKey` a short hex reached the chain as a 2-byte compValue.
    expect(
      calldataMatches([], [], { callWithinAllowance: "0x1234" })()
    ).toEqual(
      calldataMatches([], [], {
        callWithinAllowance: encodeKey("0x1234"),
      })()
    )
  })
})
