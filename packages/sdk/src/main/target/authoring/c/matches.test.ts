import { describe, expect, it } from "vitest"
import { Operator, ParameterType } from "zodiac-roles-deployments"

import { calldataMatches } from "./matches"
import { etherWithinAllowance } from "./allowances"
import { encodeKey } from "../../../keys"

describe("calldataMatches", () => {
  it("creates the correct structure for etherWithinAllowance", () => {
    const result = calldataMatches(
      [etherWithinAllowance(encodeKey("test-allowance"))],
      []
    )()

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
})
