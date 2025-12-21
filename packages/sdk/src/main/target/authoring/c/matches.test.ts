import { describe, expect, it } from "vitest"
import { Operator, Encoding } from "zodiac-roles-deployments"

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
})
