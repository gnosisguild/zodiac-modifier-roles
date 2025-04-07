import { expect, it, suite } from "vitest"
import { Operator, AbiType } from "zodiac-roles-deployments"

import { conditionAddress } from "./conditionId"
import { normalizeCondition } from "./normalize"

suite("conditionAddress", () => {
  it("calculates the create2 storage address of the condition", () => {
    const normalizedCondition = normalizeCondition({
      operator: Operator.Matches,
      paramType: AbiType.Calldata,
      children: [
        {
          operator: Operator.Matches,
          paramType: AbiType.Tuple,
          children: [
            {
              operator: Operator.EqualToAvatar,
              paramType: AbiType.Static,
            },
            {
              operator: Operator.EqualTo,
              paramType: AbiType.Dynamic,
              compValue:
                "0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000016617262697472756d666f756e646174696f6e2e65746800000000000000000000",
            },
            { operator: Operator.Pass, paramType: AbiType.Static },
            { operator: Operator.Pass, paramType: AbiType.Static },
            {
              operator: Operator.Pass,
              paramType: AbiType.Array,
              children: [
                { operator: Operator.Pass, paramType: AbiType.Static },
              ],
            },
            { operator: Operator.Pass, paramType: AbiType.Dynamic },
            {
              operator: Operator.EqualTo,
              paramType: AbiType.Dynamic,
              compValue:
                "0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000008736e617073686f74000000000000000000000000000000000000000000000000",
            },
          ],
        },
        {
          operator: Operator.Matches,
          paramType: AbiType.Tuple,
          children: [
            {
              operator: Operator.EqualTo,
              paramType: AbiType.Dynamic,
              compValue:
                "0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000008736e617073686f74000000000000000000000000000000000000000000000000",
            },
          ],
        },
      ],
    })
    expect(conditionAddress(normalizedCondition)).to.equal(
      "0xa835a51f2a581493b7416daed729cc78e0f68224" // see: https://arbiscan.io/address/0xa835a51f2a581493b7416daed729cc78e0f68224#code
    )
  })
})
