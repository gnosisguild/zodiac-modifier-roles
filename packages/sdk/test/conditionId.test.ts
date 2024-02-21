import { expect } from "chai"

import { conditionId, normalizeCondition } from "../src/conditions"
import { Operator, ParameterType } from "../src/types"

describe("conditionId", () => {
  it("calculates the create2 storage address of the condition", () => {
    const normalizedCondition = normalizeCondition({
      operator: Operator.Matches,
      paramType: ParameterType.Calldata,
      children: [
        {
          operator: Operator.Matches,
          paramType: ParameterType.Tuple,
          children: [
            {
              operator: Operator.EqualToAvatar,
              paramType: ParameterType.Static,
            },
            {
              operator: Operator.EqualTo,
              paramType: ParameterType.Dynamic,
              compValue:
                "0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000016617262697472756d666f756e646174696f6e2e65746800000000000000000000",
            },
            { operator: Operator.Pass, paramType: ParameterType.Static },
            { operator: Operator.Pass, paramType: ParameterType.Static },
            {
              operator: Operator.Pass,
              paramType: ParameterType.Array,
              children: [
                { operator: Operator.Pass, paramType: ParameterType.Static },
              ],
            },
            { operator: Operator.Pass, paramType: ParameterType.Dynamic },
            {
              operator: Operator.EqualTo,
              paramType: ParameterType.Dynamic,
              compValue:
                "0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000008736e617073686f74000000000000000000000000000000000000000000000000",
            },
          ],
        },
        {
          operator: Operator.Matches,
          paramType: ParameterType.Tuple,
          children: [
            {
              operator: Operator.EqualTo,
              paramType: ParameterType.Dynamic,
              compValue:
                "0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000008736e617073686f74000000000000000000000000000000000000000000000000",
            },
          ],
        },
      ],
    })
    expect(conditionId(normalizedCondition)).to.equal(
      "0xa835a51f2a581493b7416daed729cc78e0f68224" // see: https://arbiscan.io/address/0xa835a51f2a581493b7416daed729cc78e0f68224#code
    )
  })
})
