import { describe, expect, it } from "vitest"
import { Operator, AbiType } from "zodiac-roles-deployments"

import { calldataMatches } from "./matches"
import { encodeKey } from "../../../keys"

describe("calldataMatches", () => {
  it("correctly encodes EtherWithinAllowance conditions", () => {
    const result = calldataMatches([], [], {
      etherWithinAllowance: encodeKey("test-allowance"),
    })()

    expect(result).toEqual({
      paramType: AbiType.Calldata,
      operator: Operator.Matches,
      children: [
        {
          paramType: AbiType.None,
          operator: Operator.EtherWithinAllowance,
          compValue: encodeKey("test-allowance"),
        },
      ],
    })
  })
})
