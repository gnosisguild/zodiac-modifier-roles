import { describe, expect, it } from "vitest"
import { Operator, ParameterType } from "zodiac-roles-deployments"

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
})
